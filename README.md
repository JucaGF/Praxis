# 🚀 Praxis

Uma plataforma de IA focada em preparar e dar confiança a jovens que estão entrando no mercado de trabalho, através de análise de currículo e simulações práticas de desafios técnicos.

## 🎯 Sobre o Projeto

O Praxis nasceu da necessidade de criar uma ponte entre o conhecimento teórico e a confiança prática exigida pelo mercado de trabalho. Muitos jovens talentosos se sentem perdidos ou inseguros ao dar os primeiros passos em suas carreiras. Nossa plataforma busca resolver esse problema, oferecendo duas ferramentas principais:

1.  **Análise de Currículo:** Um assistente de IA que fornece feedback instantâneo e construtivo sobre o currículo do usuário, ajudando a destacar suas qualidades e a corrigir erros comuns.
2.  **Desafios Práticos:** Simulações de tarefas reais de trabalho, onde o usuário pode resolver problemas de código e receber uma avaliação da IA, simulando um ambiente de code review.

O objetivo é ser um ambiente seguro para praticar, errar e aprender, preparando o usuário para os desafios reais do dia a dia profissional.

## ✨ Funcionalidades Principais (MVP)

* **Análise de Currículo com IA:** O usuário insere o texto do seu currículo e recebe um relatório com pontos fortes e sugestões de melhoria.
* **Simulador de Desafios Técnicos:** O usuário escolhe um desafio, escreve o código em um editor integrado e submete para receber feedback da IA sobre a solução.
* **Interface Simples e Focada:** Um design limpo para que o usuário se concentre no que realmente importa: seu desenvolvimento.

## 🛠️ Tecnologias Utilizadas

Este projeto é construído com tecnologias modernas, visando performance e uma ótima experiência de desenvolvimento.

| Parte             | Tecnologia                                                                                                 |
| :---------------- | :--------------------------------------------------------------------------------------------------------- |
| **Frontend** | [React](https://reactjs.org/) (com [Vite](https://vitejs.dev/))                                            |
| **Estilização** | [TailwindCSS](https://tailwindcss.com/)                                                                    |
| **Backend** | [Python 3.11+](https://www.python.org/) com [FastAPI](https://fastapi.tiangolo.com/)                         |
| **IA** | [Google Gemini 1.5 Pro](https://ai.google.dev/)                                                            |
| **Editor de Código** | [Monaco Editor](https://microsoft.github.io/monaco-editor/)                                          |
| **Ambiente Python** | [uv](https://github.com/astral-sh/uv)                                                                      |

## 🚀 Começando

Para rodar este projeto localmente, siga os passos abaixo.

### Pré-requisitos

* **Node.js** (versão 18 ou superior) - [Download](https://nodejs.org/)
* **Python** (versão 3.11 ou superior) - [Download](https://www.python.org/)
* **Git** - [Download](https://git-scm.com/)
* **uv** - Um instalador e resolvedor de pacotes Python extremamente rápido. [Instruções de instalação](https://github.com/astral-sh/uv).
* Uma chave de API do **Google AI Studio** para o Gemini - [Obtenha sua chave](https://aistudio.google.com/app/apikey)

### Instalação do Backend

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/seu-usuario/praxis.git](https://github.com/seu-usuario/praxis.git)
    cd praxis/backend
    ```

2.  **Crie e ative um ambiente virtual com `uv`:**
    ```bash
    # Cria o ambiente na pasta .venv
    uv venv

    # Ativa o ambiente
    # Windows
    .\.venv\Scripts\activate
    # Linux / macOS
    source .venv/bin/activate
    ```

3.  **Instale as dependências com `uv`:**
    ```bash
    uv pip install -r requirements.txt
    ```

4.  **Configure as variáveis de ambiente:**
    * Crie um arquivo chamado `.env` na pasta `backend`.
    * Adicione sua chave da API do Gemini:
        ```
        GOOGLE_API_KEY="SUA_CHAVE_DE_API_AQUI"
        ```

5.  **Rode o servidor:**
    ```bash
    uvicorn main:app --reload
    ```
    O backend estará rodando em `http://127.0.0.1:8000`.

### Instalação do Frontend

1.  **Navegue até a pasta do frontend (em um novo terminal):**
    ```bash
    cd ../frontend
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as variáveis de ambiente:**
    * Crie um arquivo chamado `.env.local` na pasta `frontend`.
    * Adicione a URL do seu backend local:
        ```
        VITE_API_BASE_URL=[http://127.0.0.1:8000](http://127.0.0.1:8000)
        ```

4.  **Rode o cliente de desenvolvimento:**
    ```bash
    npm run dev
    ```
    Abra `http://localhost:5173` (ou a porta indicada no seu terminal) para ver o projeto no navegador.