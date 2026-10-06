import { ExportacaoLeituraErro } from "./tipos";

/**
 * Tamanho de cada página. 500 fica abaixo do padrão de 1.000 linhas do PostgREST,
 * para as respostas não ficarem grandes, e é bem menor que a memória do servidor
 * para o volume de um app pessoal.
 */
export const TAMANHO_PAGINA = 500;

export const MENSAGEM_FALHA_GERACAO = "Não foi possível gerar o arquivo agora. Tente novamente.";

type Linha = Record<string, unknown>;
type RespostaPagina = { data: unknown; error: unknown };

/**
 * Lê todas as linhas de uma consulta, uma página por vez, sem depender do limite de
 * linhas do servidor (Max Rows).
 *
 * Paginação por cursor sobre `id`, e não por deslocamento (offset). Cada página
 * começa depois do último `id` recebido, então nada é pulado nem repetido, mesmo se
 * a usuária gravar durante a exportação. Como o cursor avança pelos ids devolvidos,
 * também funciona se o servidor cortar uma página abaixo do tamanho pedido.
 *
 * A leitura termina só quando uma página volta vazia, e não quando volta menor que o
 * tamanho: uma página curta pode ser só o corte do servidor, não o fim dos dados.
 *
 * Qualquer erro, exceção ou inconsistência (id ausente ou que não avança) interrompe
 * tudo. Nenhum resultado parcial é devolvido como sucesso.
 *
 * A consulta de cada página precisa: selecionar `id` (explícito), filtrar por
 * user_id, ordenar por id ascendente e aplicar `limit(tamanho)`. Cada página com
 * cursor adiciona `gt("id", cursor)`.
 */
export async function lerTodasAsLinhas(
  consultaDaPagina: (cursor: string | null, tamanho: number) => PromiseLike<RespostaPagina>
): Promise<Linha[]> {
  const linhas: Linha[] = [];
  let cursor: string | null = null;

  for (;;) {
    let resposta: RespostaPagina;
    try {
      resposta = await consultaDaPagina(cursor, TAMANHO_PAGINA);
    } catch {
      throw new ExportacaoLeituraErro(MENSAGEM_FALHA_GERACAO);
    }

    if (resposta.error) {
      throw new ExportacaoLeituraErro(MENSAGEM_FALHA_GERACAO);
    }

    const lote = (resposta.data ?? []) as Linha[];
    if (lote.length === 0) {
      return linhas;
    }

    const ultimoId = lote[lote.length - 1].id;
    if (typeof ultimoId !== "string" || (cursor !== null && ultimoId <= cursor)) {
      // Sem id válido, ou sem avançar, o cursor não garante progresso: parar com erro.
      throw new ExportacaoLeituraErro(MENSAGEM_FALHA_GERACAO);
    }

    linhas.push(...lote);
    cursor = ultimoId;
  }
}
