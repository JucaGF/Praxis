// src/utils/submissionHelpers.js
/**
 * Helpers para preparar dados de submissão de desafios
 */

/**
 * Prepara dados de submissão para Code Challenge
 */
export function prepareCodeSubmission({ challengeId, files, mainFile, timeTaken, commitMessage, notes }) {
  return {
    challenge_id: challengeId,
    submitted_code: {
      type: "codigo",
      files: files,
      main_file: mainFile || Object.keys(files)[0]
    },
    commit_message: commitMessage,
    notes: notes,
    time_taken_sec: timeTaken
  };
}

/**
 * Prepara dados de submissão para Daily Task Challenge
 */
export function prepareDailyTaskSubmission({ challengeId, content, timeTaken, notes }) {
  return {
    challenge_id: challengeId,
    submitted_code: {
      type: "texto_livre",
      content: content
    },
    notes: notes,
    time_taken_sec: timeTaken
  };
}

/**
 * Prepara dados de submissão para Organization Challenge
 */
export function prepareOrganizationSubmission({ challengeId, sections, implementation, timeTaken, notes }) {
  return {
    challenge_id: challengeId,
    submitted_code: {
      type: "planejamento",
      sections: sections,
      form_data: sections,
      implementation: implementation
    },
    notes: notes,
    time_taken_sec: timeTaken
  };
}

/**
 * Valida se a submissão tem conteúdo suficiente
 */
export function validateSubmission(type, data) {
  switch (type) {
    case "code":
      return data.files && Object.keys(data.files).length > 0 && 
             Object.values(data.files).some(code => code && code.trim().length > 0);
    
    case "dailytask":
      return data.content && data.content.trim().length >= 50;
    
    case "organization":
      return data.sections && 
             Object.keys(data.sections).length > 0 &&
             data.implementation && 
             data.implementation.trim().length >= 100;
    
    default:
      return false;
  }
}

/**
 * Mensagens de erro por tipo
 */
export function getValidationMessage(type) {
  const messages = {
    "code": "Por favor, escreva algum código antes de enviar.",
    "dailytask": "A resposta precisa ter pelo menos 50 caracteres.",
    "organization": "Preencha todas as seções do planejamento (mínimo 100 caracteres na implementação)."
  };
  
  return messages[type] || "Por favor, complete o desafio antes de enviar.";
}
