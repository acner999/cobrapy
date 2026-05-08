/**
 * Configuración de cuentas que crea `npm run db:seed`.
 *
 * Política:
 * - En desarrollo (NODE_ENV !== 'production'): si una variable de entorno está vacía,
 *   se usa el default declarado abajo. Esto da onboarding cero-config para devs nuevos.
 * - En producción: todas las variables son obligatorias. Si alguna falta, el seed aborta.
 *
 * Esto evita que credenciales sintéticas tipo "cobrapy123" terminen en una DB productiva.
 */

interface SeedAccountSpec {
  envEmail: string;
  envName: string;
  envPassword: string;
  defaults: { email: string; name: string; password: string };
}

const SPECS = {
  admin: {
    envEmail: 'SEED_ADMIN_EMAIL',
    envName: 'SEED_ADMIN_NAME',
    envPassword: 'SEED_ADMIN_PASSWORD',
    defaults: { email: 'admin@cobrapy.test', name: 'Super Admin', password: 'cobrapy123' },
  },
  demo: {
    envEmail: 'SEED_DEMO_EMAIL',
    envName: 'SEED_DEMO_NAME',
    envPassword: 'SEED_DEMO_PASSWORD',
    defaults: { email: 'demo@cobrapy.test', name: 'Juan Demo', password: 'cobrapy123' },
  },
  manager: {
    envEmail: 'SEED_MANAGER_EMAIL',
    envName: 'SEED_MANAGER_NAME',
    envPassword: 'SEED_MANAGER_PASSWORD',
    defaults: { email: 'gerente@cobrapy.test', name: 'María Gerente', password: 'cobrapy123' },
  },
  operator: {
    envEmail: 'SEED_OPERATOR_EMAIL',
    envName: 'SEED_OPERATOR_NAME',
    envPassword: 'SEED_OPERATOR_PASSWORD',
    defaults: { email: 'cajero@cobrapy.test', name: 'Cajero del Tereré', password: 'cobrapy123' },
  },
  accountant: {
    envEmail: 'SEED_ACCOUNTANT_EMAIL',
    envName: 'SEED_ACCOUNTANT_NAME',
    envPassword: 'SEED_ACCOUNTANT_PASSWORD',
    defaults: { email: 'contador@cobrapy.test', name: 'Pedro Contador', password: 'cobrapy123' },
  },
} satisfies Record<string, SeedAccountSpec>;

export interface SeedAccount { email: string; name: string; password: string }

export interface SeedConfig {
  admin: SeedAccount;
  demo: SeedAccount;
  manager: SeedAccount;
  operator: SeedAccount;
  accountant: SeedAccount;
  demoRuc: string;
  demoPhone: string | undefined;
  isDevDefaults: boolean;
}

export function loadSeedConfig(env: NodeJS.ProcessEnv): SeedConfig {
  const isProd = env.NODE_ENV === 'production';
  const missing: string[] = [];
  const usingDefaults: string[] = [];

  function resolve(key: keyof typeof SPECS): SeedAccount {
    const spec = SPECS[key];
    const email = env[spec.envEmail];
    const name = env[spec.envName];
    const password = env[spec.envPassword];

    if (!email || !name || !password) {
      if (isProd) {
        if (!email) missing.push(spec.envEmail);
        if (!name) missing.push(spec.envName);
        if (!password) missing.push(spec.envPassword);
        return spec.defaults; // se ignora; vamos a abortar
      }
      usingDefaults.push(key);
      return spec.defaults;
    }
    return { email, name, password };
  }

  const config: SeedConfig = {
    admin: resolve('admin'),
    demo: resolve('demo'),
    manager: resolve('manager'),
    operator: resolve('operator'),
    accountant: resolve('accountant'),
    demoRuc: env.SEED_DEMO_RUC ?? '80000000-1',
    demoPhone: env.SEED_DEMO_PHONE || undefined,
    isDevDefaults: usingDefaults.length > 0,
  };

  if (isProd && missing.length > 0) {
    throw new Error(
      `Seed abortado: en producción es obligatorio definir las siguientes variables de entorno:\n` +
      missing.map((v) => `  - ${v}`).join('\n'),
    );
  }

  if (config.isDevDefaults) {
    console.log(`⚠️  Usando credenciales de desarrollo para: ${usingDefaults.join(', ')}.`);
    console.log(`   Para overridear, definí las variables SEED_* en tu .env.\n`);
  }

  return config;
}
