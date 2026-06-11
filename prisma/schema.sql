-- CreateTable
CREATE TABLE "Funcionario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nivel" TEXT NOT NULL,
    "podeCorporativo" BOOLEAN NOT NULL DEFAULT false,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Codigo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "valor" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "pool" TEXT NOT NULL,
    "donoId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'disponivel',
    "conviteId" INTEGER,
    "resgateConfirmadoEm" DATETIME,
    "presenteEm" DATETIME,
    CONSTRAINT "Codigo_donoId_fkey" FOREIGN KEY ("donoId") REFERENCES "Funcionario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Codigo_conviteId_fkey" FOREIGN KEY ("conviteId") REFERENCES "Convite" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Convite" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hostId" INTEGER NOT NULL,
    "convidadoId" INTEGER NOT NULL,
    "canais" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "expiraEm" DATETIME NOT NULL,
    "vipOmelete" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "magicToken" TEXT NOT NULL,
    CONSTRAINT "Convite_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "Funcionario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Convite_convidadoId_fkey" FOREIGN KEY ("convidadoId") REFERENCES "Convidado" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConviteParcela" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "conviteId" INTEGER NOT NULL,
    "pool" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "qtd" INTEGER NOT NULL,
    "vip" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ConviteParcela_conviteId_fkey" FOREIGN KEY ("conviteId") REFERENCES "Convite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Convidado" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "empresa" TEXT,
    "cargo" TEXT,
    "nascimento" DATETIME,
    "consentimentoEm" DATETIME,
    "optoutRegua" BOOLEAN NOT NULL DEFAULT false,
    "resgateDeclarado" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "ComunicacaoLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "convidadoId" INTEGER NOT NULL,
    "categoria" TEXT NOT NULL,
    "passo" TEXT NOT NULL,
    "canal" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "data" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ComunicacaoLog_convidadoId_fkey" FOREIGN KEY ("convidadoId") REFERENCES "Convidado" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReguaPasso" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "categoria" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "rotulo" TEXT NOT NULL,
    "timing" TEXT NOT NULL,
    "dataRef" TEXT,
    "canal" TEXT NOT NULL,
    "condicao" TEXT,
    "assunto" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "AgendaItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dia" TEXT NOT NULL,
    "horario" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "DominioBloqueado" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dominio" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "atorId" INTEGER,
    "acao" TEXT NOT NULL,
    "alvo" TEXT NOT NULL,
    "detalhe" TEXT NOT NULL,
    "data" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Config" (
    "chave" TEXT NOT NULL PRIMARY KEY,
    "valor" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Funcionario_email_key" ON "Funcionario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Codigo_valor_key" ON "Codigo"("valor");

-- CreateIndex
CREATE UNIQUE INDEX "Convite_magicToken_key" ON "Convite"("magicToken");

-- CreateIndex
CREATE UNIQUE INDEX "Convidado_email_key" ON "Convidado"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DominioBloqueado_dominio_key" ON "DominioBloqueado"("dominio");

