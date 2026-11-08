import { Type, type Static } from "@sinclair/typebox";
export const CompanySchema = Type.Object({
  contacts: Type.Union([
    Type.Null(),
    Type.Object({
      phone: Type.String({ pattern: "^\\+[0-9]{10,15}$" }),
      address: Type.Optional(Type.String()),
      hours: Type.Optional(Type.String()),
      legalName: Type.String(),
      requisites: Type.String(),
      messenger: Type.Optional(Type.String({ pattern: "^https://" })),
    }),
  ]),
  stories: Type.Array(
    Type.Object({
      id: Type.String(),
      title: Type.String(),
      text: Type.String(),
      kind: Type.Union([
        Type.Literal("delivery"),
        Type.Literal("service"),
        Type.Literal("team"),
      ]),
      image: Type.String(),
      imageAlt: Type.String(),
      sourceUrl: Type.Optional(Type.String({ pattern: "^https://" })),
      serviceSlug: Type.Optional(Type.String()),
      approved: Type.Boolean(),
    }),
  ),
});
export type CompanyContent = Static<typeof CompanySchema>;
