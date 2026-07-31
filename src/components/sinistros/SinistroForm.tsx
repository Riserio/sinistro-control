import { useEffect, useState } from "react";
import type { FieldDef, ModuleKey } from "@/lib/schema";
import { MODULES, SECTIONS } from "@/lib/schema";
import type { SinistroRecord } from "@/lib/dataStore";
import { criar, atualizar } from "@/lib/dataStore";
import { useUsuarioAtual } from "@/components/UserProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  const listId = field.options ? `opts-${field.key}` : undefined;
  if (field.type === "textarea") {
    return <Textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)} />;
  }
  return (
    <>
      <Input
        type={field.type === "date" ? "date" : field.type === "text" ? "text" : "number"}
        step={field.type === "currency" ? "0.01" : undefined}
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {field.options && (
        <datalist id={listId}>
          {field.options.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
      )}
    </>
  );
}

export function SinistroForm({
  modulo,
  registro,
  onSaved,
  onCancel,
}: {
  modulo: ModuleKey;
  registro?: SinistroRecord | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const fields = MODULES[modulo].fields;
  const { usuario } = useUsuarioAtual();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init: Record<string, string> = {};
    for (const f of fields) {
      const v = registro?.[f.key];
      init[f.key] = v === null || v === undefined ? "" : String(v);
    }
    setValues(init);
  }, [registro, fields]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (registro) {
        await atualizar(modulo, registro.id, values, usuario);
        toast.success("Sinistro atualizado", { description: `Alterado por ${usuario}` });
      } else {
        await criar(modulo, values, usuario);
        toast.success("Sinistro cadastrado", { description: `Criado por ${usuario}` });
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {SECTIONS.map((section) => {
        const secFields = fields.filter((f) => f.section === section);
        if (!secFields.length) return null;
        return (
          <section key={section} className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-primary">{section}</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {secFields.map((f) => (
                <div
                  key={f.key}
                  className={f.type === "textarea" ? "sm:col-span-2 lg:col-span-3" : ""}
                >
                  <Label className="mb-1.5 block text-xs text-muted-foreground">{f.label}</Label>
                  <FieldInput
                    field={f}
                    value={values[f.key] ?? ""}
                    onChange={(v) => setValues((p) => ({ ...p, [f.key]: v }))}
                  />
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-card py-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {registro ? "Salvar alterações" : "Cadastrar sinistro"}
        </Button>
      </div>
    </form>
  );
}
