CREATE TABLE IF NOT EXISTS EMPRESAS (
  empresa_id   INT            NOT NULL,
  nome         VARCHAR(60)    NOT NULL,
  slogan       VARCHAR(120)   NOT NULL,
  ano_fund     VARCHAR(60)    NOT NULL,
  pts_totais   INT            NOT NULL DEFAULT 70
);
