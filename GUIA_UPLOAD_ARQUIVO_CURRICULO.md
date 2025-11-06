# 📄 Guia: Upload de Currículo via Arquivo (PDF, DOCX, etc)

## 🎯 Visão Geral

Agora você pode fazer upload de currículos em **arquivos** (PDF, DOCX, PPTX, etc) além de texto puro!

O sistema usa a biblioteca **Unstructured.io** para extrair texto automaticamente de diversos formatos.

## 📋 Formatos Suportados

| Formato | Extensões | MIME Type | OCR? |
|---------|-----------|-----------|------|
| **PDF** | `.pdf` | `application/pdf` | ✅ Sim |
| **Word** | `.docx`, `.doc` | `application/vnd.openxmlformats-...` | ❌ Não |
| **PowerPoint** | `.pptx`, `.ppt` | `application/vnd.openxmlformats-...` | ❌ Não |
| **Texto** | `.txt`, `.md` | `text/plain`, `text/markdown` | ❌ Não |
| **Imagens** | `.png`, `.jpg`, `.jpeg`, `.tiff` | `image/png`, `image/jpeg` | ✅ Sim |

## 🚀 Como Usar

### 1. Instalação das Dependências

#### Opção A: Instalação Completa (Recomendado)

```bash
cd backend
pip install "unstructured[all-docs]"
```

#### Opção B: Instalação Mínima (Sem OCR)

```bash
pip install unstructured pypdf python-docx python-pptx
```

#### Opção C: Usar Fallback Simples (Sem Unstructured)

Se não quiser instalar Unstructured, o sistema tem fallback para:
- PDF: usa `PyPDF2`
- DOCX: usa `python-docx`

```bash
pip install PyPDF2 python-docx python-pptx
```

**Limitações do fallback:**
- ❌ Sem OCR (PDFs escaneados não funcionarão)
- ❌ Extração básica (perde formatação)
- ❌ Não suporta imagens

### 2. Dependências do Sistema (Para OCR)

#### Windows
1. **Tesseract OCR**:
   - Baixar: https://github.com/UB-Mannheim/tesseract/wiki
   - Instalar e adicionar ao PATH
   
2. **Poppler** (para pdf2image):
   - Baixar: https://github.com/oschwartz10612/poppler-windows/releases/
   - Extrair e adicionar `bin/` ao PATH

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr tesseract-ocr-por
sudo apt-get install poppler-utils
sudo apt-get install libtesseract-dev
```

#### macOS
```bash
brew install tesseract tesseract-lang
brew install poppler
```

### 3. Rodar Migração do Banco de Dados

```bash
# Conecte ao banco e execute:
psql -U seu_usuario -d seu_banco -f backend/migrations/add_file_support_resumes.sql
```

Ou use o Supabase Dashboard → SQL Editor → colar conteúdo do arquivo.

## 🔌 Endpoints da API

### Upload via Arquivo (NOVO)

```bash
POST /resumes/upload/file
Content-Type: multipart/form-data

Parâmetros:
- file: UploadFile (required) - Arquivo PDF, DOCX, etc
- title: string (optional) - Título do currículo
```

**Exemplo com cURL:**

```bash
curl -X POST "http://localhost:8000/resumes/upload/file" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "file=@/caminho/para/curriculo.pdf" \
  -F "title=Meu Currículo 2024"
```

**Exemplo com Python:**

```python
import requests

url = "http://localhost:8000/resumes/upload/file"
headers = {"Authorization": "Bearer SEU_TOKEN"}

with open("curriculo.pdf", "rb") as f:
    files = {"file": f}
    data = {"title": "Meu Currículo 2024"}
    
    response = requests.post(url, headers=headers, files=files, data=data)
    print(response.json())
```

**Resposta:**

```json
{
  "id": 1,
  "profile_id": "uuid-do-usuario",
  "title": "Meu Currículo 2024",
  "original_content": "João Silva\n\nDesenvolvedor Full Stack...",
  "created_at": "2024-11-05T10:30:00Z",
  "has_analysis": false,
  "original_filename": "curriculo.pdf",
  "file_type": "application/pdf",
  "file_size_bytes": 245678
}
```

### Upload via Texto (Mantido)

```bash
POST /resumes/upload
Content-Type: application/json

Body:
{
  "title": "Meu Currículo",
  "content": "# João Silva\n\nDesenvolvedor Full Stack..."
}
```

## 🎨 Atualização no Frontend

### Opção 1: Input de Arquivo Simples

Adicione ao componente de upload:

```jsx
const [file, setFile] = useState(null);
const [uploadType, setUploadType] = useState("text"); // "text" ou "file"

const handleFileUpload = async () => {
  if (!file) {
    alert("Selecione um arquivo");
    return;
  }
  
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", resumeTitle || file.name);
  
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/resumes/upload/file`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log("✅ Arquivo enviado:", result);
      await loadResumes();
      setFile(null);
    } else {
      const error = await response.json();
      alert("Erro: " + error.detail);
    }
  } catch (error) {
    console.error("❌ Erro:", error);
    alert("Erro ao enviar arquivo: " + error.message);
  }
};

// JSX
<div>
  <label className="block text-sm font-medium mb-2">
    <input
      type="radio"
      value="text"
      checked={uploadType === "text"}
      onChange={(e) => setUploadType(e.target.value)}
    />
    Colar Texto
  </label>
  
  <label className="block text-sm font-medium mb-2">
    <input
      type="radio"
      value="file"
      checked={uploadType === "file"}
      onChange={(e) => setUploadType(e.target.value)}
    />
    Enviar Arquivo (PDF, DOCX, etc)
  </label>
  
  {uploadType === "text" ? (
    <textarea
      value={resumeContent}
      onChange={(e) => setResumeContent(e.target.value)}
      placeholder="Cole seu currículo aqui..."
      rows={8}
      className="w-full px-3 py-2 border rounded"
    />
  ) : (
    <input
      type="file"
      accept=".pdf,.doc,.docx,.pptx,.txt,.md"
      onChange={(e) => setFile(e.target.files[0])}
      className="w-full px-3 py-2 border rounded"
    />
  )}
  
  <button
    onClick={uploadType === "text" ? handleUploadResume : handleFileUpload}
    className="mt-3 px-4 py-2 bg-primary-500 rounded"
  >
    {uploadType === "text" ? "Enviar Texto" : "Enviar Arquivo"}
  </button>
</div>
```

### Opção 2: Drag and Drop (Mais Moderno)

```jsx
const [isDragging, setIsDragging] = useState(false);

const handleDrop = (e) => {
  e.preventDefault();
  setIsDragging(false);
  
  const file = e.dataTransfer.files[0];
  if (file) {
    setFile(file);
  }
};

const handleDragOver = (e) => {
  e.preventDefault();
  setIsDragging(true);
};

// JSX
<div
  onDrop={handleDrop}
  onDragOver={handleDragOver}
  onDragLeave={() => setIsDragging(false)}
  className={`
    border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
    ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-zinc-300'}
  `}
>
  <input
    type="file"
    id="file-upload"
    accept=".pdf,.doc,.docx,.pptx,.txt,.md"
    onChange={(e) => setFile(e.target.files[0])}
    className="hidden"
  />
  
  <label htmlFor="file-upload" className="cursor-pointer">
    {file ? (
      <div>
        <p className="font-medium">📄 {file.name}</p>
        <p className="text-sm text-zinc-500">
          {(file.size / 1024).toFixed(2)} KB
        </p>
      </div>
    ) : (
      <div>
        <p className="font-medium">Arraste seu currículo aqui</p>
        <p className="text-sm text-zinc-500">
          ou clique para selecionar
        </p>
        <p className="text-xs text-zinc-400 mt-2">
          PDF, DOCX, PPTX, TXT (máx 10 MB)
        </p>
      </div>
    )}
  </label>
</div>
```

## 🔍 Como Funciona Internamente

1. **Usuário faz upload** do arquivo PDF/DOCX
2. **Backend recebe** o arquivo via `UploadFile`
3. **DocumentParser valida** tipo e tamanho
4. **Unstructured.io extrai** texto do arquivo:
   - Para PDFs: extrai texto + OCR se escaneado
   - Para DOCX: extrai parágrafos e formatação
   - Para imagens: aplica OCR
5. **Texto extraído** é salvo em `original_content`
6. **Arquivo binário** é salvo em `file_data` (opcional)
7. **Metadados** são salvos (filename, type, size)
8. **Análise continua** normalmente usando o texto extraído

## ⚙️ Configurações Avançadas

### Desabilitar Unstructured (Usar Fallback)

Em `backend/app/infra/document_parser.py`:

```python
# Força fallback simples
document_parser = DocumentParser(use_unstructured=False)
```

### Alterar Idiomas do OCR

Em `backend/app/infra/document_parser.py`, linha ~123:

```python
ocr_languages="por+eng",  # Português + Inglês
# ou
ocr_languages="por",  # Apenas Português
# ou
ocr_languages="eng+spa+fra",  # Inglês + Espanhol + Francês
```

### Aumentar Limite de Tamanho

Em `backend/app/infra/document_parser.py`, linha ~52:

```python
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
# Altere para:
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB
```

**⚠️ Atenção:** Arquivos maiores podem:
- Demorar muito para processar
- Consumir muita memória
- Estourar limite do banco de dados (BYTEA)

**Recomendação para produção:**
- Use **S3/Cloud Storage** para arquivos grandes
- Salve apenas URL no banco
- Processe assincronamente (Celery/RQ)

## 🐛 Troubleshooting

### Erro: "unstructured não instalado"

```bash
pip install "unstructured[all-docs]"
```

### Erro: "Tesseract não encontrado"

**Windows:**
1. Baixe: https://github.com/UB-Mannheim/tesseract/wiki
2. Instale
3. Adicione ao PATH: `C:\Program Files\Tesseract-OCR`

**Linux:**
```bash
sudo apt-get install tesseract-ocr
```

### Erro: "pdf2image requires poppler"

**Windows:**
1. Baixe poppler: https://github.com/oschwartz10612/poppler-windows/releases/
2. Extraia
3. Adicione `bin/` ao PATH

**Linux:**
```bash
sudo apt-get install poppler-utils
```

### PDF escaneado não extrai texto

- Certifique-se de que Tesseract OCR está instalado
- Verifique idiomas: `tesseract --list-langs`
- Instale idioma português: `sudo apt-get install tesseract-ocr-por`

### Arquivo DOCX não funciona

```bash
pip install python-docx
```

### Extração muito lenta

- Use estratégia "fast" em vez de "auto"
- Ou desabilite OCR para documentos digitais

Em `document_parser.py`:

```python
strategy="fast",  # Mais rápido, sem OCR
# strategy="auto",  # Mais lento, com OCR se necessário
```

### Erro: "File too large"

- Reduza `MAX_FILE_SIZE` ou
- Comprima o PDF antes de enviar

## 📊 Comparação: Unstructured vs Fallback

| Feature | Unstructured | Fallback (PyPDF2/python-docx) |
|---------|-------------|-------------------------------|
| PDF Digital | ✅ Excelente | ✅ Básico |
| PDF Escaneado | ✅ OCR | ❌ Não funciona |
| DOCX | ✅ Formatação | ✅ Texto básico |
| Tabelas | ✅ Estruturadas | ❌ Texto solto |
| Imagens | ✅ OCR + descrição | ❌ Ignoradas |
| Layouts complexos | ✅ Inteligente | ❌ Quebra |
| Velocidade | ⚠️ Moderada | ✅ Rápida |
| Tamanho instalação | ⚠️ ~500 MB | ✅ ~10 MB |

## 🔐 Segurança e LGPD/GDPR

### Dados Armazenados

- ✅ **original_content** (TEXT): Texto extraído - OBRIGATÓRIO
- ✅ **file_data** (BYTEA): Arquivo binário - OPCIONAL
- ✅ **original_filename**: Nome do arquivo
- ✅ **file_type**: MIME type
- ✅ **file_size_bytes**: Tamanho

### Recomendações

1. **Produção**: NÃO salve `file_data` no banco
   - Use S3/Cloud Storage
   - Salve apenas URL
   - Processe e descarte

2. **Criptografia**: Considere criptografar arquivos sensíveis

3. **Exclusão**: Implemente exclusão permanente ao deletar conta

4. **Retenção**: Defina política de retenção (ex: 90 dias)

5. **Consentimento**: Informe usuário sobre armazenamento

## 🎯 Próximos Passos

- [ ] Adicionar frontend com drag-and-drop
- [ ] Integrar com S3 para arquivos grandes
- [ ] Processamento assíncrono (Celery)
- [ ] Pré-visualização do arquivo antes do upload
- [ ] Download do arquivo original
- [ ] Versionamento de currículos
- [ ] Comparação entre versões
- [ ] Exportação da análise em PDF

## 📚 Recursos

- **Unstructured Docs**: https://docs.unstructured.io/
- **Tesseract OCR**: https://github.com/tesseract-ocr/tesseract
- **FastAPI File Upload**: https://fastapi.tiangolo.com/tutorial/request-files/
