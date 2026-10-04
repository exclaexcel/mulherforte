import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROTULO_PRAZO_CONGELAMENTO, TEXTO_AJUDA_PRAZO } from "@/lib/marmitas/referencias";

/**
 * Campo de prazo de congelamento, usado nos dois cadastros de receita. Fica vazio
 * se a usuária não souber: nenhum valor é preenchido ou sugerido, e nenhum link
 * externo aparece aqui. As referências ficam só na página Sobre o plano.
 */
export function CampoPrazoCongelamento() {
  return (
    <div className="space-y-2">
      <Label htmlFor="validade_congelado_dias">{ROTULO_PRAZO_CONGELAMENTO}</Label>
      <p className="text-xs text-stone-500">{TEXTO_AJUDA_PRAZO}</p>
      <Input
        id="validade_congelado_dias"
        name="validade_congelado_dias"
        type="number"
        inputMode="numeric"
        min={1}
        step={1}
      />
    </div>
  );
}
