# 📋 Indicação: Criar Tabela de Histórico de Skills

## O que precisa fazer

Criar uma tabela chamada `skill_history` para guardar o histórico de evolução das skills dos usuários.

---

## SQL para executar

```sql
CREATE TABLE skill_history (
    id SERIAL PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tech_skills JSONB NOT NULL,
    trigger VARCHAR(50) DEFAULT 'submission',
    submission_id INTEGER REFERENCES submissions(id) ON DELETE SET NULL,
    changed_skills JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_skill_history_profile_id ON skill_history(profile_id);
CREATE INDEX idx_skill_history_created_at ON skill_history(created_at);
```

---

## Estrutura da tabela

- `profile_id` - UUID do usuário
- `tech_skills` - JSONB com todas as skills naquele momento (ex: `{"Python": 70, "SQL": 60}`)
- `trigger` - O que causou a mudança: `"submission"`, `"manual_update"`, `"initial"`
- `submission_id` - ID da submissão (se aplicável)
- `changed_skills` - JSONB com o que mudou (ex: `{"Python": {"from": 65, "to": 70, "delta": 5}}`)
- `created_at` - Timestamp

---

## Para que serve

- Guardar feedback atual: Análise detalhada da submissão
- Guardar histórico: Ver como as skills evoluem ao longo do tempo
- Gerar gráficos de evolução
- Analytics e estatísticas

---

**Tempo estimado:** 10-15 minutos

