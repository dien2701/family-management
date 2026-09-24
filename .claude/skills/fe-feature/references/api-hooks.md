# Mẫu api.ts và hooks.ts (feature `member`)

```ts
// features/member/api.ts
import { client } from "@/services/client";
import type { components } from "@/services/schema";

export type Member = components["schemas"]["MemberResponse"];
export type MemberCreate = components["schemas"]["MemberCreateRequest"];

export const memberApi = {
  get: (id: number) => client.get<Member>(`/members/${id}`),
  create: (body: MemberCreate) => client.post<Member>("/members", body),
};
```

```ts
// features/member/hooks.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { memberApi, type MemberCreate } from "./api";

export const memberKeys = {
  all: ["member"] as const,
  detail: (id: number) => [...memberKeys.all, "detail", id] as const,
};

export function useMember(id: number) {
  return useQuery({ queryKey: memberKeys.detail(id), queryFn: () => memberApi.get(id) });
}

export function useCreateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: MemberCreate) => memberApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: memberKeys.all }),
  });
}
```
Tên `client` và các phương thức lấy theo `services/client.ts` thực tế.
