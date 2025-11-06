# Docker - Configuração para Parser de Currículo

## Mudanças Realizadas

### 1. Requirements.txt Consolidado

As dependências do parser de currículo foram integradas ao `backend/requirements.txt` principal:

- **Unstructured.io**: Parser inteligente de documentos (PDF, DOCX, PPTX, imagens)
- **Dependências de PDF**: pdf2image, pdfminer.six, pypdf, pypdfium2
- **Dependências de Office**: python-docx, python-pptx
- **OCR**: pytesseract, Pillow
- **Tabelas**: openpyxl, pandas
- **NLP**: nltk
- **Detecção de arquivos**: python-magic

### 2. Dockerfiles Atualizados

Ambos os Dockerfiles (`Dockerfile` e `Dockerfile.dev`) foram atualizados para incluir as dependências do sistema Linux necessárias:

#### Dependências Adicionadas:
- **tesseract-ocr**: Motor de OCR para reconhecimento de texto em imagens
- **tesseract-ocr-por**: Suporte para língua portuguesa no Tesseract
- **libtesseract-dev**: Bibliotecas de desenvolvimento do Tesseract
- **poppler-utils**: Utilitários para conversão e manipulação de PDFs
- **libmagic1**: Biblioteca para detecção de tipos de arquivo

### 3. Arquivo Temporário Removido

O arquivo `requirements_resume_parser.txt` foi removido, pois suas dependências foram consolidadas no arquivo principal.

## Como Usar

### Rebuildar Containers

Para aplicar as mudanças, você precisa rebuildar os containers Docker:

```bash
# Parar containers atuais
docker-compose down

# Rebuildar com as novas dependências
docker-compose build --no-cache

# Iniciar novamente
docker-compose up -d
```

### Desenvolvimento

Para desenvolvimento local com hot-reload:

```bash
# Rebuildar apenas o container de desenvolvimento
docker-compose build --no-cache backend

# Iniciar em modo desenvolvimento
docker-compose up backend
```

### Makefile

Se você está usando o Makefile do projeto:

```bash
# Rebuildar tudo
make rebuild

# Ou apenas o backend
make build-backend
```

## Verificação

Para verificar se tudo foi instalado corretamente dentro do container:

```bash
# Entrar no container
docker-compose exec backend bash

# Verificar Tesseract
tesseract --version

# Verificar Poppler
pdftoppm -v

# Verificar Python packages
pip list | grep unstructured
pip list | grep pytesseract
```

## Troubleshooting

### Problemas com OCR
Se o OCR não estiver funcionando:
```bash
# Instalar idiomas adicionais do Tesseract
docker-compose exec backend apt-get update
docker-compose exec backend apt-get install -y tesseract-ocr-eng
```

### Problemas com PDFs
Se houver erros ao processar PDFs:
- Verifique se o poppler-utils está instalado
- Certifique-se de que o arquivo não está corrompido
- Tente com um PDF diferente para isolar o problema

### Build Lento
O build pode levar mais tempo agora devido às novas dependências:
- Use cache do Docker quando possível (remova `--no-cache` se não houver mudanças)
- As camadas são otimizadas para cache máximo

## Notas Importantes

1. **Tamanho da Imagem**: A imagem Docker ficará maior (~500MB+) devido ao Tesseract e suas dependências
2. **Primeira Build**: A primeira build levará mais tempo para baixar e instalar tudo
3. **Cache**: Builds subsequentes serão mais rápidos graças ao cache de camadas do Docker
4. **Produção**: Use sempre a versão específica das dependências (não usar `latest`)

## Próximos Passos

Após rebuildar os containers:

1. Implementar a rota de upload de currículo
2. Criar o serviço de parsing
3. Integrar com o Gemini AI para análise
4. Testar com diferentes formatos de arquivo

