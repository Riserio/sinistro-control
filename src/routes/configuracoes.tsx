import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  listarUsuarios,
  salvarUsuario,
  excluirUsuario,
  getRegras,
  setRegras,
  FATORES,
  type Usuario,
  type Fator,
  type Perfil,
} from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Plus, Trash2, Save, Info } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações | BP Seguradora" },
      { name: "description", content: "Cadastro de usuários, fator de acesso e regras de alertas." },
    ],
  }),
  component: Configuracoes,
});

const PERFIS: Perfil[] = ["admin", "editor", "visualizador"];

const vazio = (): Usuario => ({
  id: "",
  nome: "",
  email: "",
  senha: "",
  fator: "palavra_chave",
  palavra_chave: "",
  ip_permitido: "",
  perfil: "editor",
  ativo: true,
});

function Configuracoes() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [dias, setDias] = useState(30);
  const [pendentes, setPendentes] = useState<SolicitacaoAcesso[]>([]);

  useEffect(() => {
    void listarUsuarios().then(setUsuarios);
    void getRegras().then((r) => setDias(r.dias_parado));
    void listarSolicitacoesPendentes().then(setPendentes);
  }, []);

  function recarregar() {
    void listarUsuarios().then(setUsuarios);
    void listarSolicitacoesPendentes().then(setPendentes);
  }

  async function salvar() {
    if (!editando) return;
    if (!editando.nome.trim() || !editando.email.trim()) {
      toast.error("Preencha nome e e-mail.");
      return;
    }
    if (!editando.id && (editando.senha ?? "").length < 6) {
      toast.error("Defina uma senha com pelo menos 6 caracteres.");
      return;
    }
    try {
      await salvarUsuario(editando);
      toast.success("Usuário salvo.");
      setEditando(null);
      recarregar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar o usuário.");
    }
  }

  async function remover(u: Usuario) {
    if (!window.confirm(`Excluir o usuário ${u.nome}?`)) return;
    try {
      await excluirUsuario(u.id);
      toast.success("Usuário excluído.");
      recarregar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível excluir o usuário.");
    }
  }

  async function decidir(id: string, aprovar: boolean) {
    await decidirSolicitacao(id, aprovar);
    toast.success(aprovar ? "Acesso aprovado." : "Acesso negado.");
    void listarSolicitacoesPendentes().then(setPendentes);
  }

  async function salvarRegras() {
    await setRegras({ dias_parado: Math.max(1, Number(dias) || 30) });
    toast.success("Regras de alerta atualizadas.");
  }

  const labelFator = (f: Fator) => FATORES.find((x) => x.valor === f)?.label ?? f;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Cadastro de usuários, fator de acesso e regras de alertas.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-lg border bg-amber-50 p-3 text-xs text-amber-900">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          Usuários, 2º fator e regras ficam salvos no banco e valem para todos. O 2º fator por IP é
          validado no servidor (IP lido dos cabeçalhos da requisição); em redes com proxy/VPN o IP
          pode variar.
        </span>
      </div>

      <Tabs defaultValue="usuarios">
        <TabsList>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="acessos">Acessos pendentes{pendentes.length ? ` (${pendentes.length})` : ""}</TabsTrigger>
          <TabsTrigger value="alertas">Regras de alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="acessos" className="mt-4 space-y-3">
          <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Solicitado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendentes.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.nome}</TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>{new Date(s.criado_em).toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button size="sm" onClick={() => void decidir(s.id, true)}>
                        Aprovar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void decidir(s.id, false)}>
                        Negar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {pendentes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                      Nenhum acesso aguardando aprovação.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>


        <TabsContent value="usuarios" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" className="gap-2" onClick={() => setEditando(vazio())}>
              <Plus className="h-4 w-4" />
              Novo usuário
            </Button>
          </div>
          <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>2º fator</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.nome}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell className="capitalize">{u.perfil}</TableCell>
                    <TableCell>
                      {labelFator(u.fator)}
                      {u.fator === "ip" && u.ip_permitido ? ` (${u.ip_permitido})` : ""}
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.ativo ? "default" : "secondary"}>
                        {u.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setEditando({ ...u })}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => remover(u)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {usuarios.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                      Nenhum usuário cadastrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="alertas" className="mt-4">
          <div className="max-w-md space-y-3 rounded-xl border bg-card p-4 shadow-sm">
            <div className="space-y-1.5">
              <Label htmlFor="dias" className="text-xs text-muted-foreground">
                Dias sem movimentação para marcar um processo como “parado”
              </Label>
              <Input
                id="dias"
                type="number"
                min={1}
                value={dias}
                onChange={(e) => setDias(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Usado na tela de Alertas e no contador do menu. Considera a Data do Aviso de
                processos ainda não finalizados.
              </p>
            </div>
            <Button size="sm" className="gap-2" onClick={salvarRegras}>
              <Save className="h-4 w-4" />
              Salvar regras
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando?.id ? "Editar usuário" : "Novo usuário"}</DialogTitle>
          </DialogHeader>
          {editando && (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Nome</Label>
                  <Input
                    value={editando.nome}
                    onChange={(e) => setEditando({ ...editando, nome: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">E-mail</Label>
                  <Input
                    type="email"
                    value={editando.email}
                    onChange={(e) => setEditando({ ...editando, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Senha</Label>
                  <Input
                    type="text"
                    value={editando.senha}
                    onChange={(e) => setEditando({ ...editando, senha: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Perfil</Label>
                  <Select
                    value={editando.perfil}
                    onValueChange={(v) => setEditando({ ...editando, perfil: v as Perfil })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERFIS.map((p) => (
                        <SelectItem key={p} value={p} className="capitalize">
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">2º fator de acesso</Label>
                <Select
                  value={editando.fator}
                  onValueChange={(v) => setEditando({ ...editando, fator: v as Fator })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FATORES.map((f) => (
                      <SelectItem key={f.valor} value={f.valor}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {FATORES.find((f) => f.valor === editando.fator)?.ajuda}
                </p>
              </div>

              {editando.fator === "palavra_chave" && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Palavra-chave</Label>
                  <Input
                    value={editando.palavra_chave ?? ""}
                    onChange={(e) => setEditando({ ...editando, palavra_chave: e.target.value })}
                  />
                </div>
              )}
              {editando.fator === "ip" && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">IP autorizado</Label>
                  <Input
                    value={editando.ip_permitido ?? ""}
                    onChange={(e) => setEditando({ ...editando, ip_permitido: e.target.value })}
                    placeholder="ex.: 189.45.10.22"
                  />
                </div>
              )}

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editando.ativo}
                  onChange={(e) => setEditando({ ...editando, ativo: e.target.checked })}
                />
                Usuário ativo
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditando(null)}>
                  Cancelar
                </Button>
                <Button className="gap-2" onClick={salvar}>
                  <Save className="h-4 w-4" />
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
