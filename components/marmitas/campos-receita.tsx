import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORIAS_RECEITA } from "@/lib/marmitas/receita";
import { CampoPrazoCongelamento } from "@/components/marmitas/campo-prazo-congelamento";

const CAMPO_TEXTO =
  "flex w-full rounded-xl border border-oliva/70 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oliva";

export type DefaultsReceita = {
  nome?: string;
  categoria?: string | null;
  validade_congelado_dias?: number | null;
  ingredientes?: string | null;
  modo_preparo?: string | null;
  dica_congelamento?: string | null;
  selos?: string[] | null;
  notas?: string | null;
};

/** Campos do cadastro completo de receita — usado em criar e em editar. */
export function CamposReceita({ defaults = {} }: { defaults?: DefaultsReceita }) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="nome">Nome da receita</Label>
        <Input id="nome" name="nome" defaultValue={defaults.nome ?? ""} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoria">Categoria</Label>
        <select
          id="categoria"
          name="categoria"
          defaultValue={defaults.categoria ?? ""}
          className={`${CAMPO_TEXTO} h-11`}
        >
          <option value="">Sem categoria</option>
          {CATEGORIAS_RECEITA.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {defaults.validade_congelado_dias ? (
        <p className="text-xs text-stone-500">
          Prazo atual: {defaults.validade_congelado_dias}{" "}
          {defaults.validade_congelado_dias === 1 ? "dia" : "dias"}. Deixe o campo abaixo em
          branco para remover, ou digite um novo valor para alterar.
        </p>
      ) : null}
      <CampoPrazoCongelamento />

      <div className="space-y-2">
        <Label htmlFor="ingredientes">Ingredientes</Label>
        <p className="text-xs text-stone-500">Um por linha, se preferir.</p>
        <textarea
          id="ingredientes"
          name="ingredientes"
          rows={6}
          defaultValue={defaults.ingredientes ?? ""}
          className={CAMPO_TEXTO}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="modo_preparo">Modo de preparo</Label>
        <textarea
          id="modo_preparo"
          name="modo_preparo"
          rows={8}
          defaultValue={defaults.modo_preparo ?? ""}
          className={CAMPO_TEXTO}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dica_congelamento">Dica para congelar</Label>
        <textarea
          id="dica_congelamento"
          name="dica_congelamento"
          rows={3}
          defaultValue={defaults.dica_congelamento ?? ""}
          className={CAMPO_TEXTO}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="selos">Marcadores</Label>
        <p className="text-xs text-stone-500">Separe por vírgula. Ex.: air fryer, congelável</p>
        <Input id="selos" name="selos" defaultValue={defaults.selos?.join(", ") ?? ""} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notas">Observações</Label>
        <textarea id="notas" name="notas" rows={4} defaultValue={defaults.notas ?? ""} className={CAMPO_TEXTO} />
      </div>
    </>
  );
}
