"""
Configuração do Parser de Documentos

Este arquivo contém as configurações do parser de documentos.
Edite este arquivo para ajustar o comportamento do parser.

Configurações disponíveis:
- USE_OCR: Habilita/desabilita OCR para PDFs escaneados e imagens
- STRATEGY: Estratégia de parsing (auto, hi_res, fast)
- OCR_LANGUAGES: Idiomas para OCR (ex: "por+eng")
- MAX_FILE_SIZE_MB: Tamanho máximo de arquivo em MB
- USE_UNSTRUCTURED: Usa Unstructured.io ou fallback simples

IMPORTANTE:
- USE_OCR=True requer Tesseract instalado
- USE_UNSTRUCTURED=True requer unstructured[all-docs] instalado
- Para produção, recomenda-se USE_OCR=False e USE_UNSTRUCTURED=True
- Para desenvolvimento, pode usar fallback simples (USE_UNSTRUCTURED=False)
"""

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
