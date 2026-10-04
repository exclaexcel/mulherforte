// Conteúdo estático copiado da planilha original (aba "Informações Importantes")
// e do guia de receitas (PDF), sem edição de texto — referência dentro do app.

export const MAPA_HORARIOS = [
  { horario: "09:30", estrutura: "Pão com queijo OU iogurte, fruta e granola; café com leite" },
  { horario: "12:00", estrutura: "Arroz, feijão, proteína, salada e legumes" },
  { horario: "16:00", estrutura: "Fruta, fibra e 1/2 medida de whey" },
  { horario: "18:30", estrutura: "Sanduíche, omelete, crepioca, panqueca ou torta" },
  { horario: "20:30", estrutura: "Shake OU iogurte com fruta e granola" },
] as const;

export const REGRAS_SEGURANCA_USDA = [
  "Resfrie completamente antes de congelar — nunca leve algo quente direto ao freezer.",
  "Congele em até 2 horas após o preparo (1 hora se a temperatura ambiente estiver acima de 32°C).",
  "Descongele sempre na geladeira, nunca em temperatura ambiente.",
  "Nunca recongele um alimento que já foi descongelado.",
  "Comida mantida continuamente a -18°C é segura indefinidamente — os prazos de alerta do app são de QUALIDADE (sabor/textura), não de segurança.",
] as const;

export const FONTE_USDA = "Fonte oficial: fsis.usda.gov e foodsafety.gov (USDA - United States Department of Agriculture)";

export const PRAZOS_ALERTA = [
  { cor: "verde", texto: "Dentro da validade: ainda faltam mais de 7 dias para o vencimento." },
  { cor: "amarelo", texto: "Próximo do vencimento: vence hoje ou faltam até 7 dias." },
  { cor: "vermelho", texto: "Vencido: a validade informada na receita já passou." },
] as const;

export const VALIDADE_NAO_INFORMADA_TEXTO =
  "Receita sem validade informada: o app mostra \"Validade não informada\" e não calcula vencimento.";

export const PONTOS_ATENCAO = [
  "Tilápia: perde textura ao congelar. Asse sem excesso de líquido e evite caldo em excesso na marmita.",
  "Pão de queijo proteico com frango: concentra polvilho + queijo + óleo (alta energia). Validar tamanho/quantidade da porção com a nutricionista.",
  "Sopa de macarrão com carne: tem duas fontes de carboidrato (macarrão + batata). Validar porção — entra como jantar completo.",
  "Crepioca doce com Amendocrem: item não identificado como prescrito no plano original. Validar quantidade com a nutricionista.",
] as const;

export const CHECKLIST_ANTES_DE_COZINHAR = [
  "Definir qual refeição a receita vai substituir.",
  'Usar medidas niveladas, não "no olho".',
  "Anotar marca e peso dos ingredientes industrializados.",
  "Registrar o peso final da preparação.",
  "Dividir o rendimento antes de guardar.",
  "Ajustar porção ou frequência com a nutricionista quando necessário.",
] as const;

export const BOAS_PRATICAS = [
  "Congele em porção individual, nunca em bloco grande — facilita descongelar rápido sem desperdício.",
  "Prefira potes de vidro (ou plástico transparente) — vai direto ao micro-ondas e dá pra ver o conteúdo sem abrir tudo.",
  "Descongele na geladeira na noite anterior — elimina a correria de descongelar na hora.",
  'Mantenha sempre 1-2 marmitas "curinga" prontas, fora do cronograma, para imprevistos.',
  "Etiquete no momento que sai do forno/fogão — não deixe para depois.",
  "Lave a louça do preparo enquanto cozinha, não depois — reduz o cansaço do dia de produção.",
  "Compre em quantidade que dura 2 semanas os itens não perecíveis (arroz, feijão, aveia, tapioca, polvilho).",
  'Mantenha um "kit de emergência": 2-3 porções de frango desfiado puro, sem tempero específico — vira pizza, wrap, sanduíche ou marmita.',
  "Decida o que vai descongelar cada noite já no domingo/sexta — não decida na hora da fome/cansaço.",
  'Se um dia do cronograma não rolar, tudo bem — não tente "recuperar" depois. O que não foi usado continua congelado esperando a próxima vez, sem pressão.',
] as const;

export const REGRA_GERAL_DANY =
  "O plano é a referência. A receita precisa facilitar a rotina, ter porção clara e continuar gostosa.";
