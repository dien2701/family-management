# Mẫu schemas.ts, strings.ts, form và trang

```ts
// features/member/strings.ts
export const memberStrings = {
  title: "Thành viên",
  add: "Thêm thành viên",
  save: "Lưu",
  fullName: "Họ và tên",
  empty: "Chưa có thành viên nào. Hãy thêm người đầu tiên.",
} as const;
```

```ts
// features/member/schemas.ts
import { z } from "zod";
export const memberFormSchema = z.object({
  fullName: z.string().min(1, "Vui lòng nhập họ tên").max(120, "Tối đa 120 ký tự"),
});
export type MemberFormValues = z.infer<typeof memberFormSchema>;
```

```tsx
// features/member/components/MemberForm.tsx
export function MemberForm({ onDone }: { onDone: () => void }) {
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } =
    useForm<MemberFormValues>({ resolver: zodResolver(memberFormSchema) });
  const create = useCreateMember();

  const submit = handleSubmit(async (values) => {
    try {
      await create.mutateAsync(values);
      onDone();
    } catch (e) {
      if (e instanceof ApiError) {
        e.errors?.forEach((f) => setError(f.field as keyof MemberFormValues, { message: f.message }));
      }
    }
  });

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium">{memberStrings.fullName}</span>
        <input {...register("fullName")} className="mt-1 h-11 w-full rounded-[12px] border border-border bg-surface-muted px-3" />
        {errors.fullName && <p role="alert" className="mt-1 text-sm text-danger">{errors.fullName.message}</p>}
      </label>
      <button type="submit" disabled={isSubmitting}
        className="h-11 cursor-pointer rounded-[10px] bg-primary px-4 font-semibold text-primary-fg hover:bg-primary-hover">
        {memberStrings.save}
      </button>
    </form>
  );
}
```

```tsx
// pages/MemberPage.tsx: chỉ ghép route với trang của feature
export { MemberListPage as default } from "@/features/member/pages/MemberListPage";
```
Class Tailwind dùng token của `docs/DESIGN.md`; ưu tiên component shadcn (`Button`, `Input`) khi đã có trong `components/ui`.
