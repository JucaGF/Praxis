-- Migration: Add file support to resumes table
-- Date: 2024-11-05
-- Description: Adiciona suporte para upload de arquivos (PDF, DOCX, etc)

-- Adicionar coluna para armazenar o nome original do arquivo
ALTER TABLE resumes 
ADD COLUMN IF NOT EXISTS original_filename VARCHAR(255);

-- Adicionar coluna para tipo MIME do arquivo
ALTER TABLE resumes 
ADD COLUMN IF NOT EXISTS file_type VARCHAR(100);

-- Adicionar coluna para tamanho do arquivo em bytes
ALTER TABLE resumes 
ADD COLUMN IF NOT EXISTS file_size_bytes INTEGER;

-- Adicionar coluna para armazenar o conteúdo binário do arquivo (se necessário)
-- NOTA: Para produção, recomenda-se usar S3/storage externo
-- Por enquanto, vamos usar BYTEA para armazenar arquivos pequenos (<10MB)
ALTER TABLE resumes 
ADD COLUMN IF NOT EXISTS file_data BYTEA;

-- Comentários para documentação
COMMENT ON COLUMN resumes.original_filename IS 'Nome original do arquivo enviado pelo usuário';
COMMENT ON COLUMN resumes.file_type IS 'Tipo MIME do arquivo (application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, etc)';
COMMENT ON COLUMN resumes.file_size_bytes IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN resumes.file_data IS 'Conteúdo binário do arquivo (usar apenas para arquivos pequenos, <10MB)';
COMMENT ON COLUMN resumes.original_content IS 'Texto extraído do arquivo usando Unstructured.io ou texto plano';
