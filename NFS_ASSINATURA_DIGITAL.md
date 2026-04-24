# Assinatura Digital XML - NFS-e

## 🎯 Resumo

Implementação completa do sistema de assinatura digital XML para NFS-e conforme especificação ABRASF 2.04 e requisitos da GINFES.

**Data:** 17/04/2026  
**Status:** ✅ Implementado e Compilado com Sucesso

---

## 📁 Arquivos Criados/Alterados

### Novos Arquivos

#### 1. `src/lib/nfs-e/assinatura.ts`
Serviço completo de assinatura digital:

- Classe `AssinaturaDigitalService` para gerenciamento do certificado
- Métodos `assinarRps()`, `assinarLote()`, `assinarCancelamento()`
- Canonicalização C14N conforme especificação W3C
- Assinatura RSA-SHA1 com chave privada
- Verificação de assinatura com chave pública
- Validação de certificado e cálculo de dias até expiração

**Funcionalidades:**
- ✅ Assinatura digital real com node-forge
- ✅ Canonicalização C14N
- ✅ Hash SHA-1 do conteúdo
- ✅ Criptografia RSA-SHA1
- ✅ Inserção do certificado X509
- ✅ Validação de assinaturas

---

### Arquivos Modificados

#### 1. `src/lib/nfs-e/auth.ts`
Atualizado com implementação completa:

- `assinarXML()` - Assinatura XML com RSA-SHA1 real
- `assinarRps()` - Assinatura específica para RPS
- `assinarLote()` - Assinatura para lote de RPS
- `assinarCancelamento()` - Assinatura para cancelamento
- `carregarCertificadoDigital()` - Carregamento PKCS#12 com node-forge
- `extrairInfoCertificado()` - Extração de informações reais do certificado

#### 2. `src/lib/nfs-e/index.ts`
Adicionados exports das novas funcionalidades:

```typescript
export {
  extrairInfoCertificado,
  assinarRps,
  assinarLote,
  assinarCancelamento,
  validarValidadeCertificado,
  prepararXmlParaAssinatura,
  templatesAssinatura,
} from './auth';
export {
  AssinaturaDigitalService,
  criarAssinaturaService,
  certificadoEstaValido,
  diasAteExpiracao,
} from './assinatura';
```

---

## 🔐 Especificações Técnicas

### Algoritmos Utilizados

| Componente | Algoritmo | Especificação |
|------------|-----------|---------------|
| Canonicalização | C14N | http://www.w3.org/TR/2001/REC-xml-c14n-20010315 |
| Digest | SHA-1 | http://www.w3.org/2000/09/xmldsig#sha1 |
| Assinatura | RSA-SHA1 | http://www.w3.org/2000/09/xmldsig#rsa-sha1 |
| Transform | Enveloped Signature | http://www.w3.org/2000/09/xmldsig#enveloped-signature |

### Estrutura da Assinatura XML

```xml
<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
  <SignedInfo>
    <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
    <SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
    <Reference URI="#idReferencia">
      <Transforms>
        <Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
      </Transforms>
      <DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>
      <DigestValue>{hash SHA-1}</DigestValue>
    </Reference>
  </SignedInfo>
  <SignatureValue>{assinatura RSA-SHA1}</SignatureValue>
  <KeyInfo>
    <X509Data>
      <X509Certificate>{certificado DER base64}</X509Certificate>
    </X509Data>
  </KeyInfo>
</Signature>
```

---

## 🚀 Como Usar

### Usando o serviço AssinaturaDigitalService

```typescript
import { criarAssinaturaService, carregarCertificadoDigital } from '@/lib/nfs-e';

// Carregar certificado
const certificado = await carregarCertificadoDigital(
  certificadoBase64,
  senha
);

// Criar serviço de assinatura
const assinaturaService = criarAssinaturaService(certificado);

// Assinar um RPS
const xmlRpsAssinado = await assinaturaService.assinarRps(xmlRps);

// Assinar um lote
const xmlLoteAssinado = await assinaturaService.assinarLote(xmlLote);

// Assinar cancelamento
const xmlCancelamentoAssinado = await assinaturaService.assinarCancelamento(xmlCancelamento);

// Verificar se está pronto
if (assinaturaService.isReady()) {
  console.log('Serviço pronto para assinatura');
}
```

### Usando as funções diretas

```typescript
import { assinarRps, assinarLote, assinarCancelamento, assinarXML } from '@/lib/nfs-e';

// Assinar RPS
const xmlRpsAssinado = await assinarRps(xmlRps, certificado);

// Assinar lote
const xmlLoteAssinado = await assinarLote(xmlLote, certificado);

// Assinar cancelamento
const xmlCancelamentoAssinado = await assinarCancelamento(xmlCancelamento, certificado);

// Assinar XML genérico
const xmlAssinado = await assinarXML(xml, certificado, 'idReferencia');
```

### Validação de Certificado

```typescript
import { certificadoEstaValido, diasAteExpiracao, extrairInfoCertificado } from '@/lib/nfs-e';

// Extrair informações
const info = await extrairInfoCertificado(certificado);

// Verificar validade
const valido = certificadoEstaValido(info);
const validoComMargem = certificadoEstaValido(info, 30); // 30 dias de margem

// Dias até expirar
const dias = diasAteExpiracao(info);
console.log(`Certificado expira em ${dias} dias`);
```

---

## 🛡️ Segurança

### Medidas Implementadas

1. **Canonicalização C14N**
   - Remove espaços em branco desnecessários
   - Normaliza atributos
   - Garante consistência na assinatura

2. **Hash SHA-1**
   - Cálculo do digest do conteúdo canonicalizado
   - Verificação de integridade

3. **Assinatura RSA-SHA1**
   - Usa chave privada do certificado
   - Algoritmo assimétrico de 2048 bits

4. **Certificado X509**
   - Incluído na assinatura para validação
   - Formato DER codificado em Base64

---

## 📊 Fluxo de Assinatura

```
XML Original
    ↓
Canonicalização C14N
    ↓
Cálculo SHA-1 do conteúdo
    ↓
Criação SignedInfo
    ↓
Assinatura RSA-SHA1 (chave privada)
    ↓
Montagem estrutura Signature
    ↓
Inserção no XML original
    ↓
XML Assinado
```

---

## 🔍 Validações Implementadas

### Assinatura
- ✅ Certificado carregado completamente
- ✅ XML bem formado
- ✅ Canonicalização conforme C14N
- ✅ Hash SHA-1 calculado corretamente
- ✅ Assinatura RSA válida
- ✅ Certificado incluído na assinatura

### Verificação
- ✅ Assinatura presente no XML
- ✅ Digest match
- ✅ SignedInfo válido
- ✅ Assinatura criptográfica verificada
- ✅ Certificado válido

---

## 🐛 Tratamento de Erros

### Erros Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| Certificado não configurado | Certificado não foi carregado | Chamar carregarCertificadoDigital primeiro |
| Chave privada não encontrada | Certificado incompleto | Verificar se o PFX contém a chave privada |
| Estrutura XML inválida | XML mal formado | Validar XML antes de assinar |
| Erro ao assinar XML | Problema na criptografia | Verificar senha do certificado |

---

## 📝 Próximos Passos

### Integração com GINFES
1. Testar emissão real em ambiente de homologação
2. Validar resposta da prefeitura
3. Implementar retry em caso de erro de assinatura
4. Logging de assinaturas para auditoria

### Melhorias Futuras
1. Suporte a assinatura com certificado A3 (token/smartcard)
2. Cache de chaves para performance
3. Assinatura em lote otimizada
4. Validação automática antes do envio

---

## 📚 Referências

- [XML Signature Syntax and Processing](https://www.w3.org/TR/xmldsig-core/)
- [Canonical XML](https://www.w3.org/TR/xml-c14n)
- [ABRASF - Associação Brasileira das Administrações de Tributos Municipais](http://www.abrasf.org.br)
- [GINFES - Gerenciador Integrado de Notas Fiscais de Serviços](https://www.ginfes.com.br)
- [node-forge](https://github.com/digitalbazaar/forge)

---

## ✅ Checklist de Implementação

- [x] Implementação da assinatura RSA-SHA1
- [x] Canonicalização C14N
- [x] Hash SHA-1
- [x] Estrutura XML Signature
- [x] Serviço AssinaturaDigitalService
- [x] Funções auxiliares (assinarRps, assinarLote, assinarCancelamento)
- [x] Verificação de assinatura
- [x] Validação de certificado
- [x] Cálculo de dias até expiração
- [x] Exports no index.ts
- [x] Build OK
- [x] Correção de warnings

---

## 🎉 Status Final

**✅ Sistema de assinatura digital XML implementado com sucesso!**

O sistema agora suporta:
- Assinatura digital real de documentos NFS-e
- Conformidade com especificação ABRASF 2.04
- Integração com certificados A1 (PFX/P12)
- Validação e verificação de assinaturas
- Gerenciamento completo do ciclo de vida do certificado

**Pronto para integração com a API GINFES/Prefeitura SP.**
