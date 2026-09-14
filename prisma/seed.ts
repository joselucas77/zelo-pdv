import prisma from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Iniciando o seed...");

  // 1. Criar ou atualizar a Loja "Zelo Shop"
  const loja = await prisma.loja.upsert({
    where: { name: "Zelo Shop" },
    update: {},
    create: {
      name: "Zelo Shop",
      ownerName: "José Lucas",
      active: true,
    },
  });

  console.log(`Loja configurada: ${loja.name} (${loja.id})`);

  // 2. Criar ou atualizar o grupo ADMIN para a loja
  const adminGroup = await prisma.accessGroup.upsert({
    where: {
      lojaId_name: {
        lojaId: loja.id,
        name: "ADMIN",
      },
    },
    update: {
      permissions: {
        dashboard: ["Visualizar"],
        historico: ["Visualizar", "Editar", "Excluir"],
        "nova-venda": ["Visualizar", "Adicionar"],
        clientes: ["Visualizar", "Adicionar", "Editar", "Excluir"],
        produtos: ["Visualizar", "Adicionar", "Editar", "Excluir"],
        categorias: ["Visualizar", "Adicionar", "Editar", "Excluir"],
        configuracoes: ["Visualizar", "Editar", "Excluir"],
        usuarios: ["Visualizar", "Adicionar", "Editar", "Excluir"],
      },
    },
    create: {
      lojaId: loja.id,
      name: "ADMIN",
      description: "Administrador do Sistema (Acesso Total)",
      active: true,
      permissions: {
        dashboard: ["Visualizar"],
        historico: ["Visualizar", "Editar", "Excluir"],
        "nova-venda": ["Visualizar", "Adicionar"],
        clientes: ["Visualizar", "Adicionar", "Editar", "Excluir"],
        produtos: ["Visualizar", "Adicionar", "Editar", "Excluir"],
        categorias: ["Visualizar", "Adicionar", "Editar", "Excluir"],
        configuracoes: ["Visualizar", "Editar", "Excluir"],
        usuarios: ["Visualizar", "Adicionar", "Editar", "Excluir"],
      },
    },
  });

  console.log(`Grupo configurado: ${adminGroup.name} (${adminGroup.id})`);

  // 3. Criar ou atualizar o usuário Admin
  const email = "joselucasa937@gmail.com";
  const password = "2468JLsc";
  const hashedPassword = await bcrypt.hash(password, 10);

  const adminUser = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      groupId: adminGroup.id,
      lojaId: loja.id,
    },
    create: {
      lojaId: loja.id,
      name: "Administrador",
      email,
      password: hashedPassword,
      active: true,
      groupId: adminGroup.id,
    },
  });

  console.log(`Usuário configurado: ${adminUser.email} (${adminUser.id})`);
  console.log("Seed finalizado com sucesso!");
}

main()
  .catch((e) => {
    console.error("Erro durante o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
