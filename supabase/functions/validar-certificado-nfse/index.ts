const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://9ninebusinesscontrol.com.br",
  "https://www.9ninebusinesscontrol.com.br",
  "https://9nineteste.9ninebusinesscontrol.com.br",
  "https://ninebpofinanceiro.lovable.app",
  "https://ninebpofinanceiro.vercel.app",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const certificadoBase64 = body.certificadoBase64;
    const senha = body.senha;

    if (!certificadoBase64 || !senha) {
      return new Response(
        JSON.stringify({ valido: false, mensagem: "Certificado e senha são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("validar-certificado: recebido, tamanho base64:", certificadoBase64.length);

    // Import node-forge for PKCS12 parsing
    let forge: any;
    try {
      const forgeModule = await import("https://esm.sh/node-forge@1.3.1");
      // esm.sh may wrap the module in { default: ... } or expose it directly
      forge = forgeModule.default?.util ? forgeModule.default
        : forgeModule.util ? forgeModule
        : (forgeModule as any).default?.default?.util ? (forgeModule as any).default.default
        : forgeModule;
      console.log("forge loaded, has util:", !!forge.util, "has pki:", !!forge.pki, "has pkcs12:", !!forge.pkcs12);
      if (!forge.util || !forge.pki || !forge.pkcs12) {
        throw new Error("node-forge carregado mas módulos necessários (util, pki, pkcs12) não estão disponíveis");
      }
    } catch (importErr) {
      console.error("validar-certificado: erro ao importar node-forge:", importErr);
      return new Response(
        JSON.stringify({ valido: false, mensagem: "Erro interno ao carregar biblioteca de certificados" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      // Decode and parse PKCS12
      const pfxDer = forge.util.decode64(certificadoBase64);
      const p12Asn1 = forge.asn1.fromDer(pfxDer);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, senha);

      // Extract certificate
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      if (!certBags[forge.pki.oids.certBag] || certBags[forge.pki.oids.certBag]!.length === 0) {
        return new Response(
          JSON.stringify({ valido: false, mensagem: "Nenhum certificado encontrado no arquivo PFX" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const cert = certBags[forge.pki.oids.certBag]![0].cert!;
      const subject = cert.subject;
      const issuer = cert.issuer;

      // Log all subject attributes for debugging
      console.log("validar-certificado: subject attributes:", subject.attributes.map((a: any) => ({
        oid: a.oid, shortName: a.shortName || "(none)", value: a.value?.substring(0, 80)
      })));

      // Extract CNPJ and name from subject
      let emitidoPara = "";
      let cnpj = "";
      for (const attr of subject.attributes) {
        if (attr.shortName === "CN") {
          emitidoPara = attr.value;
        }
      }

      // ICP-Brasil: CNPJ está no OID 2.16.76.4.3.3 (pessoa jurídica)
      const icpCnpjAttr = subject.attributes.find((a: any) => a.oid === "2.16.76.4.3.3");
      if (icpCnpjAttr) {
        const raw = icpCnpjAttr.value;
        const digits = raw.replace(/\D/g, "");
        if (digits.length >= 14) {
          cnpj = digits.substring(digits.length - 14);
        }
      }

      // Fallback: CNPJ em OU (ICP-Brasil comum)
      if (!cnpj) {
        const ouAttr = subject.attributes.find((a: any) =>
          a.oid === "2.5.4.11" && /CNPJ/i.test(a.value)
        );
        if (ouAttr) {
          const cnpjMatch = ouAttr.value.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/);
          if (cnpjMatch) cnpj = cnpjMatch[0].replace(/\D/g, "");
        }
      }

      // Fallback: CNPJ no CN (Common Name)
      if (!cnpj) {
        const cnAttr = subject.attributes.find((a: any) => a.shortName === "CN");
        if (cnAttr) {
          const cnpjMatch = cnAttr.value.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/);
          if (cnpjMatch) cnpj = cnpjMatch[0].replace(/\D/g, "");
        }
      }

      // Fallback: CNPJ em serialNumber (OID 2.5.4.5)
      if (!cnpj) {
        const serialAttr = subject.attributes.find((a: any) => a.oid === "2.5.4.5");
        if (serialAttr) {
          const digits = serialAttr.value.replace(/\D/g, "");
          if (digits.length >= 14) {
            cnpj = digits.substring(digits.length - 14);
          }
        }
      }

      // Fallback: buscar 14 dígitos consecutivos em qualquer atributo
      if (!cnpj) {
        for (const attr of subject.attributes) {
          const digits = (attr.value || "").replace(/\D/g, "");
          if (digits.length >= 14) {
            cnpj = digits.substring(digits.length - 14);
            break;
          }
        }
      }

      // Fallback: subjectAltName extension
      if (!cnpj && cert.extensions) {
        for (const ext of cert.extensions) {
          if (ext.name === "subjectAltName" && (ext as any).altNames) {
            for (const altName of (ext as any).altNames) {
              if (altName.type === 6 && typeof altName.value === "string") {
                const match = altName.value.match(/(\d{14})/);
                if (match) { cnpj = match[1]; break; }
              }
            }
          }
          if (cnpj) break;
        }
      }

      console.log("validar-certificado: CNPJ extraído:", cnpj || "(não encontrado)");

      // Extract issuer name
      let emissor = "";
      for (const attr of issuer.attributes) {
        if (attr.shortName === "CN" || attr.shortName === "O") {
          emissor = attr.value;
          break;
        }
      }

      // Check validity
      const now = new Date();
      const validoAte = cert.validity.notAfter;
      const validoDe = cert.validity.notBefore;

      if (now < validoDe) {
        return new Response(
          JSON.stringify({
            valido: false,
            emitidoPara,
            cnpj,
            validoAte: validoAte.toISOString(),
            emissor,
            mensagem: `Certificado ainda não está vigente. Válido a partir de ${validoDe.toLocaleDateString("pt-BR")}.`,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (now > validoAte) {
        return new Response(
          JSON.stringify({
            valido: false,
            emitidoPara,
            cnpj,
            validoAte: validoAte.toISOString(),
            emissor,
            mensagem: `Certificado expirado em ${validoAte.toLocaleDateString("pt-BR")}.`,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify private key - try pkcs8ShroudedKeyBag first (most common for ICP-Brasil)
      const keyBagsShrouded = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
      const keyBagsShorthand = p12.getBags({ bagType: forge.pki.oids.pkcs8ShorthandKeyBag });
      const keyBagsPlain = p12.getBags({ bagType: forge.pki.oids.keyBag });
      const hasPrivateKey =
        (keyBagsShrouded[forge.pki.oids.pkcs8ShroudedKeyBag]?.length ?? 0) > 0 ||
        (keyBagsShorthand[forge.pki.oids.pkcs8ShorthandKeyBag]?.length ?? 0) > 0 ||
        (keyBagsPlain[forge.pki.oids.keyBag]?.length ?? 0) > 0;

      if (!hasPrivateKey) {
        return new Response(
          JSON.stringify({
            valido: false,
            emitidoPara,
            cnpj,
            validoAte: validoAte.toISOString(),
            emissor,
            mensagem: "Certificado não contém chave privada. O arquivo PFX deve incluir a chave privada para emissão de NFS-e.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Calculate days until expiration
      const diasParaExpirar = Math.ceil((validoAte.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      console.log("validar-certificado: sucesso, CNPJ:", cnpj, "emissor:", emissor);

      return new Response(
        JSON.stringify({
          valido: true,
          emitidoPara,
          cnpj,
          validoAte: validoAte.toISOString(),
          emissor,
          diasParaExpirar,
          mensagem: diasParaExpirar <= 30
            ? `Certificado válido por mais ${diasParaExpirar} dias. Considere renovar em breve.`
            : "Certificado válido",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (pfxError: any) {
      console.error("validar-certificado: erro ao processar PFX:", pfxError.message);
      let mensagem = "Erro ao processar certificado";
      if (pfxError.message?.includes("password") || pfxError.message?.includes("PKCS#12") || pfxError.message?.includes("decrypt")) {
        mensagem = "Senha do certificado incorreta";
      } else if (pfxError.message?.includes("ASN1") || pfxError.message?.includes("DER")) {
        mensagem = "Arquivo PFX inválido ou corrompido";
      } else {
        mensagem = pfxError.message || mensagem;
      }

      return new Response(
        JSON.stringify({ valido: false, mensagem }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStack = error instanceof Error ? error.stack : "";
    console.error("validar-certificado: erro geral:", errMsg, errStack);
    return new Response(
      JSON.stringify({ valido: false, mensagem: errMsg || "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});