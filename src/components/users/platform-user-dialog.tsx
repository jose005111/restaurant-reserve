import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useUpdateUser } from "@/hooks/use-users";
import { getApiErrorMessage } from "@/lib/api";
import {
  platformUserSchema,
  type PlatformUserFormValues,
} from "@/schemas/staff";
import { UserRole, type StaffUser } from "@/types/api";
import { useAuthStore } from "@/stores/auth-store";

export function PlatformUserDialog({
  user,
  restaurantName,
}: {
  user: StaffUser;
  restaurantName: string;
}) {
  const [open, setOpen] = useState(false);
  const isSelf = useAuthStore((state) => state.user?.id === user.id);
  const update = useUpdateUser();
  const form = useForm<PlatformUserFormValues>({
    resolver: zodResolver(platformUserSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      password: "",
    },
  });

  const handleOpen = (next: boolean) => {
    setOpen(next);
    if (next)
      form.reset({
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        password: "",
      });
  };

  const save = form.handleSubmit(async (values) => {
    try {
      await update.mutateAsync({
        id: user.id,
        input: {
          name: values.name,
          email: values.email,
          ...(user.role === UserRole.SUPER_ADMIN || isSelf
            ? {}
            : {
                role: values.role as
                  typeof UserRole.ADMIN | typeof UserRole.COUNTER,
              }),
          ...(values.password ? { password: values.password } : {}),
        },
      });
      toast.success("Utilizador actualizado");
      setOpen(false);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Não foi possível actualizar o utilizador"),
      );
    }
  });

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="size-4" /> Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar {user.name}</DialogTitle>
          <DialogDescription>
            Restaurante: {restaurantName}. A associação não pode ser alterada.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4" noValidate>
          <Field
            label="Nome"
            htmlFor={`platform-name-${user.id}`}
            error={form.formState.errors.name?.message}
          >
            <Input id={`platform-name-${user.id}`} {...form.register("name")} />
          </Field>
          <Field
            label="Email"
            htmlFor={`platform-email-${user.id}`}
            error={form.formState.errors.email?.message}
          >
            <Input
              id={`platform-email-${user.id}`}
              type="email"
              {...form.register("email")}
            />
          </Field>
          <Field
            label="Função"
            htmlFor={`platform-role-${user.id}`}
            error={form.formState.errors.role?.message}
          >
            <select
              id={`platform-role-${user.id}`}
              disabled={user.role === UserRole.SUPER_ADMIN || isSelf}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              {...form.register("role")}
            >
              {user.role === UserRole.SUPER_ADMIN ? (
                <option value="SUPER_ADMIN">Super Admin</option>
              ) : null}
              <option value="ADMIN">Administrador</option>
              <option value="COUNTER">Balcão</option>
            </select>
          </Field>
          <Field
            label="Nova password"
            htmlFor={`platform-password-${user.id}`}
            hint="Deixa vazio para manter a password actual."
            error={form.formState.errors.password?.message}
          >
            <Input
              id={`platform-password-${user.id}`}
              type="password"
              autoComplete="new-password"
              {...form.register("password")}
            />
          </Field>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}{" "}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
