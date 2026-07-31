import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { USUARIOS } from "@/lib/format";

interface Ctx {
  usuario: string;
  setUsuario: (u: string) => void;
}

const UserContext = createContext<Ctx>({ usuario: USUARIOS[0]!, setUsuario: () => {} });

export function UserProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuarioState] = useState<string>(USUARIOS[0]!);

  useEffect(() => {
    const saved = window.localStorage.getItem("bp_usuario_atual");
    if (saved) setUsuarioState(saved);
  }, []);

  const setUsuario = (u: string) => {
    setUsuarioState(u);
    window.localStorage.setItem("bp_usuario_atual", u);
  };

  return <UserContext.Provider value={{ usuario, setUsuario }}>{children}</UserContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUsuarioAtual() {
  return useContext(UserContext);
}
