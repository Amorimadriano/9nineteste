import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { certificadoBase64, senha } = await req.json();

    if (!certificadoBase64 || !senha) {
      return new Response(
        JSON.stringify({ valido: false, mensagem: "Certificado e senha são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Import node-forge for real PKCS12 parsing
    const forge = await import("https://esm.sh/node-forge@1.3.1/dist/forge.js");

    try {
      // Decode and parse PKCS12
      const pfxDer = forge.util.decode64(certificadoBase64);
      const p12Asn1 = forge.asn1.fromDer(pfxDer);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, senha);

      // Extract certificate
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      if (!certBags[forge.pki.oids.certBag] || certBags[forge.pki.oids.certBag]!.length === 0) {
        throw new Error("Nenhum certificado encontrado no arquivo PFX");
      }

      const cert = certBags[forge.pki.oids.certBag]![0].cert!;
      const subject = cert.subject;
      const issuer = cert.issuer;

      // Extract CNPJ and name from subject
      let emitidoPara = "";
      let cnpj = "";
      for (const attr of subject.attributes) {
        if (attr.shortName === "CN") {
          emitidoPara = attr.value;
          // Try to extract CNPJ from CN
          const cnpjMatch = attr.value.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/);
          if (cnpjMatch) {
            cnpj = cnpjMatch[0].replace(/\D/g, "");
          }
        }
      }

      // If no CNPJ in CN, try subjectAltName or OID
      if (!cnpj) {
        const extensions = cert.extensions || [];
        for (const ext of extensions) {
          if (ext.name === "subjectAltName" && ext.altNames) {
            for (const altName of ext.altNames) {
              if (altName.type === 6 && typeof altName.value === "string") {
                const match = altName.value.match(/(\d{14})/);
                if (match) {
                  cnpj = match[1];
                  break;
                }
              }
            }
          }
          // OID 2.16.840.1.113730.4.1 is for subject alternative name
          // OID for CNPJ in ICP-Brasil: 2.16.860.1.5.5.1
          if (ext.id === "2.16.860.1.5.5.1" || ext.id === "2.16.76.1.3.5") {
            try {
              const value = ext.value;
              const match = (typeof value === "string" ? value : "").match(/(\d{14})/);
              if (match) {
                cnpj = match[1];
                break;
              }
            } catch {}
          }
        }
      }

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

      // Verify private key
      const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShorthandKeyBag });
      const keyBags2 = p12.getBags({ bagType: forge.pki.oids.keyBag });
      const hasPrivateKey = (keyBags[forge.pki.oids.pkcs8ShorthandKeyBag]?.length ?? 0) > 0 || (keyBags2[forge.pki.oids.keyBag]?.length ?? 0) > 0;

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
      // Common error messages
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
    console.error("Erro na validação do certificado:", error);
    return new Response(
      JSON.stringify({ valido: false, mensagem: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});