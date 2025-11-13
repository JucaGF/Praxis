# Sistema de Timer Persistente para Desafios

## Visão Geral

Implementação de um sistema de timer funcional e persistente para os desafios da Praxis. O timer agora mantém seu estado mesmo quando o desafio é fechado, e exibe o progresso diretamente nos cards da página inicial.

## Arquivos Criados/Modificados

### Novos Arquivos

1. **`frontend/src/hooks/useChallengeTimer.js`**
   - Hook personalizado para gerenciar o estado do timer
   - Usa `localStorage` para persistência
   - Gerencia status do desafio: `NOT_STARTED`, `IN_PROGRESS`, `EXPIRED`, `COMPLETED`

2. **`frontend/src/components/challenges/ChallengeTimer.jsx`**
   - Componente visual do timer com barra de progresso
   - Mostra status com cores e ícones apropriados
   - Usado nos cards e dentro dos desafios

3. **`frontend/src/components/challenges/ChallengeCard.jsx`**
   - Card de desafio genérico com timer integrado
   - Botões adaptativos baseados no status
   - Pode ser usado em diferentes páginas

4. **`frontend/src/components/challenges/ChallengeModal.jsx`**
   - Modal/página de desafio com timer no topo
   - Aviso quando faltam 2 minutos
   - Desabilita envio quando tempo expira

5. **`frontend/src/components/challenges/ChallengeCardHome.jsx`**
   - Card especializado para a página Home
   - Integra com o sistema de expansão existente
   - Mostra timer e status do desafio

### Arquivos Modificados

1. **`frontend/src/assets/components/challenges/CodeChallenge.jsx`**
   - Integrado com `useChallengeTimer`
   - Timer persistente substituindo timer local
   - Botão de envio desabilitado quando tempo expira

2. **`frontend/src/assets/components/challenges/DailyTaskChallenge.jsx`**
   - Integrado com `useChallengeTimer`
   - Timer visível no header e rodapé
   - Validação de tempo expirado

3. **`frontend/src/assets/components/challenges/OrganizationChallenge.jsx`**
   - Integrado com `useChallengeTimer`
   - Feedback visual quando tempo expira
   - Botão de envio desabilitado

4. **`frontend/src/assets/pages/Home.jsx`**
   - Usa `ChallengeCardHome` para exibir desafios
   - Timer visível nos cards sem precisar expandir
   - Status do desafio sempre visível

## Funcionalidades Implementadas

### ✅ Timer Persistente
- Timer salvo em `localStorage`
- Não reseta ao fechar o desafio
- Continua contando mesmo se a página for recarregada
- Cada desafio tem seu próprio timer independente

### ✅ Status do Desafio
- **NOT_STARTED**: Desafio ainda não iniciado
- **IN_PROGRESS**: Desafio em andamento com timer ativo
- **EXPIRED**: Tempo esgotado, não pode mais enviar
- **COMPLETED**: Concluído (preparado para futura avaliação por IA)

### ✅ Visualização no Card
- Timer e barra de progresso visíveis
- Cores e ícones indicam o status atual
- Botões adaptativos:
  - "Iniciar Desafio" - quando não iniciado
  - "Continuar Desafio" - quando em progresso
  - "Tentar Novamente" - quando expirado
  - "Ver Resultado" - quando concluído (futuro)

### ✅ Dentro do Desafio
- Timer sempre visível no header
- Aviso quando faltam 2 minutos (em `ChallengeModal`)
- Botão de envio desabilitado quando tempo expira
- Feedback visual claro do status

### ✅ Tentar Novamente
- Botão aparece automaticamente quando tempo expira
- Reseta o timer e permite nova tentativa
- Limpa o estado anterior do desafio

## Como Usar

### No Card do Desafio (Home)

```jsx
import ChallengeCardHome from '../components/challenges/ChallengeCardHome';

<ChallengeCardHome 
  challenge={challenge}
  expanded={expanded}
  onToggle={() => toggleExpand(challenge.id)}
/>
```

### Hook Personalizado

```jsx
import { useChallengeTimer } from '../../hooks/useChallengeTimer';

const { 
  status,              // Status atual
  formattedTime,       // Tempo formatado (MM:SS)
  remainingSeconds,    // Segundos restantes
  progress,            // Progresso em % (0-100)
  isExpired,           // Boolean: tempo esgotou?
  isInProgress,        // Boolean: em andamento?
  isCompleted,         // Boolean: concluído?
  isNotStarted,        // Boolean: não iniciado?
  startChallenge,      // Função: iniciar
  resetChallenge,      // Função: resetar
  completeChallenge    // Função: marcar como completo
} = useChallengeTimer(challengeId, durationMinutes);
```

### Componente Timer Visual

```jsx
import { ChallengeTimer } from './ChallengeTimer';

<ChallengeTimer
  status={status}
  formattedTime={formattedTime}
  progress={progress}
  isExpired={isExpired}
  isCompleted={isCompleted}
  className="mb-4"
/>
```

## Próximos Passos

### 🔄 Para Implementar Avaliação por IA

1. Quando o usuário enviar a resposta, chamar `completeChallenge()`
2. Enviar resposta para o backend para avaliação
3. Salvar resultado da avaliação no desafio
4. Exibir feedback da IA quando status for `COMPLETED`

### Exemplo de Implementação:

```jsx
const handleSubmit = async () => {
  try {
    // Enviar para o backend
    const result = await api.post(`/challenges/${challengeId}/submit`, {
      answer: userAnswer,
      time_taken: elapsedSeconds
    });
    
    // Marcar como completo
    completeChallenge();
    
    // Navegar para ver resultado
    navigate('/home');
  } catch (error) {
    console.error('Erro ao enviar:', error);
  }
};
```

### 🎯 Melhorias Futuras

1. **Sincronização com Backend**
   - Salvar estado do timer no banco de dados
   - Sincronizar entre diferentes dispositivos

2. **Notificações**
   - Notificar usuário quando tempo está acabando
   - Notificar quando receber feedback da IA

3. **Estatísticas**
   - Tempo médio para completar cada tipo de desafio
   - Taxa de sucesso vs. tempo gasto

4. **Pausar Timer**
   - Opção de pausar desafio (com limite de pausas)
   - Útil para situações de emergência

## Estrutura de Dados (localStorage)

```json
{
  "praxis_challenge_timers": {
    "challenge_id_1": {
      "status": "in_progress",
      "startTime": 1699728000000,
      "elapsedSeconds": 1245,
      "durationMinutes": 30
    },
    "challenge_id_2": {
      "status": "expired",
      "startTime": 1699714000000,
      "elapsedSeconds": 1800,
      "durationMinutes": 30
    }
  }
}
```

## Teste Manual

1. **Iniciar um desafio** - Verificar que o timer começa
2. **Fechar e reabrir** - Timer deve continuar do ponto onde parou
3. **Deixar expirar** - Deve desabilitar envio e mostrar "Tentar Novamente"
4. **Tentar novamente** - Timer deve resetar
5. **Múltiplos desafios** - Cada um com seu próprio timer independente
