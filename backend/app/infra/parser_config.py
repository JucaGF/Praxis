# Configuração do Parser de Documentos
# Edite este arquivo para ajustar o comportamento do parser

# ==================== ESTRATÉGIA DE PARSING ====================

# Escolha UMA das opções abaixo (descomente a linha que quiser usar):

# OPÇÃO 1: COM OCR (requer Tesseract instalado)
# - Extrai texto de PDFs escaneados e imagens
# - Mais lento mas mais completo
USE_OCR = True
STRATEGY = "auto"  # auto, hi_res, fast
OCR_LANGUAGES = "por+eng"  # Português + Inglês

# OPÇÃO 2: SEM OCR (não precisa Tesseract)
# - Mais rápido
# - Funciona apenas com PDFs digitais (texto selecionável)
# USE_OCR = False
# STRATEGY = "fast"
# OCR_LANGUAGES = None

# ==================== LIMITES ====================

# Tamanho máximo de arquivo em MB
MAX_FILE_SIZE_MB = 10

# ==================== FALLBACK ====================

# Se True, usa Unstructured.io (recomendado)
# Se False, usa PyPDF2/python-docx (simples)
USE_UNSTRUCTURED = True

# ==================== INSTRUÇÕES ====================

# 1. Se não quiser instalar Tesseract:
#    - Mude USE_OCR para False
#    - Mude STRATEGY para "fast"
#    - Mude OCR_LANGUAGES para None
#
# 2. Se não quiser instalar Unstructured:
#    - Mude USE_UNSTRUCTURED para False
#    - Instale: pip install PyPDF2 python-docx
#
# 3. Para PDFs digitais normais:
#    - USE_OCR = False é suficiente
#
# 4. Para PDFs escaneados ou imagens:
#    - USE_OCR = True (requer Tesseract)
