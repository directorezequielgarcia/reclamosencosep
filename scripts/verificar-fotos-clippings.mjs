import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

const boletines = await p.boletin.findMany({
  where: { tipo: "CLIPPING" },
  orderBy: { fechaPublicacion: "desc" },
  select: { id: true, fuente: true, fotoUrl: true },
});

for (const b of boletines) {
  if (!b.fotoUrl) {
    console.log(`SIN FOTO  ${b.fuente} (${b.id})`);
    continue;
  }
  try {
    const res = await fetch(b.fotoUrl, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      },
    });
    const ct = res.headers.get("content-type");
    console.log(`${res.ok && ct?.startsWith("image") ? "OK  " : "FAIL"}  ${res.status} ${ct}  ${b.fuente}`);
  } catch (err) {
    console.log(`ERROR ${b.fuente}: ${err.message}`);
  }
}

await p.$disconnect();
