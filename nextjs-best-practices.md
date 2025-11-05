# Boas Práticas Next.js

## Estrutura de Arquivos
- Mantenha componentes em `src/components/`
- Páginas em `src/app/` (App Router)
- Utilitários em `src/lib/` ou `src/utils/`
- Tipos TypeScript em `src/types/`

## Componentes
- Use componentes funcionais com TypeScript
- Prefira `export default` para componentes principais
- Mantenha componentes pequenos e focados
- Use props tipadas com interfaces

## Testes
- **Arquivos de teste devem acompanhar seus implementadores**
- Nome: `ComponentName.test.tsx`
- Localização: mesmo diretório do componente
- Exemplo: `src/components/Chat.test.tsx` junto com `src/components/Chat.tsx`

## Performance
- Use `next/image` para imagens
- Implemente lazy loading quando necessário
- Otimize bundle com dynamic imports
- Use `next/link` para navegação

## SEO
- Configure metadata em `layout.tsx`
- Use `next/head` quando necessário
- Implemente structured data

## Código
- Use ESLint e Prettier
- Mantenha imports organizados
- Prefira arrow functions para componentes
- Use async/await para operações assíncronas

## Estado
- Use React hooks para estado local
- Considere Context API para estado global
- Evite prop drilling excessivo

## Estilização
- Use Tailwind CSS
- Mantenha estilos próximos aos componentes
- Evite CSS global desnecessário
