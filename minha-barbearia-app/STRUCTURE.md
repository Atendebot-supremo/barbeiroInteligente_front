# Estrutura do Projeto - Barbeiro Inteligente

## 📁 Estrutura de Pastas

```
src/
├── components/          # Componentes reutilizáveis
│   ├── auth/           # Componentes de autenticação
│   │   └── ProtectedRoute.tsx
│   ├── layout/         # Componentes de layout
│   │   ├── Header.tsx
│   │   └── Layout.tsx
│   └── ui/             # Componentes de interface
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       └── Loading.tsx
├── contexts/           # Contextos React
│   └── AuthContext.tsx
├── hooks/              # Hooks customizados
│   ├── useLocalStorage.ts
│   └── useApi.ts
├── pages/              # Páginas da aplicação
│   ├── LoginPage.tsx
│   ├── CadastroPage.tsx
│   ├── ServicosPage.tsx
│   ├── AgendaPage.tsx
│   └── routes.tsx
├── services/           # Serviços de API
│   ├── api.ts
│   └── mockApiService.ts
├── types/              # Definições de tipos TypeScript
│   └── index.ts
├── utils/              # Funções utilitárias
│   ├── validation.ts
│   └── format.ts
└── App.tsx
```

## 🔧 Componentes Adicionados

### Contexts
- **AuthContext**: Gerencia estado de autenticação global
  - `user`: Dados do usuário logado
  - `isAuthenticated`: Status de autenticação
  - `login()`: Função de login
  - `logout()`: Função de logout

### Components/UI
- **Button**: Botão reutilizável com variantes
  - Variantes: primary, secondary, outline, danger
  - Tamanhos: sm, md, lg
  - Estados: loading, disabled

- **Input**: Campo de entrada com validação
  - Suporte a diferentes tipos
  - Exibição de erros
  - Estados: disabled, required

- **Card**: Container para conteúdo
  - Título e subtítulo opcionais
  - Hover effects
  - Click handler

- **Loading**: Componente de carregamento
  - Tamanhos: sm, md, lg
  - Texto customizável

### Components/Layout
- **Header**: Cabeçalho com navegação
  - Logo e nome da aplicação
  - Menu de navegação
  - Informações do usuário
  - Botão de logout

- **Layout**: Layout principal para páginas autenticadas
  - Header fixo
  - Área de conteúdo responsiva

### Components/Auth
- **ProtectedRoute**: Proteção de rotas
  - Verifica autenticação
  - Redireciona para login se não autenticado
  - Loading state durante verificação

### Hooks
- **useLocalStorage**: Hook para localStorage
  - Persistência de dados
  - TypeScript support

- **useApi**: Hook para chamadas de API
  - Estados: loading, error, data
  - Função execute para chamadas
  - Função reset para limpar estado

### Utils
- **validation.ts**: Funções de validação
  - Email, senha, telefone
  - Preço, duração
  - Campos obrigatórios

- **format.ts**: Funções de formatação
  - Moeda brasileira
  - Datas e horários
  - Duração em minutos
  - Telefone brasileiro

## 🚀 Como Usar

### 1. Contexto de Autenticação
```tsx
import { useAuth } from '../contexts/AuthContext';

const MyComponent = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  // ...
};
```

### 2. Componentes UI
```tsx
import { Button, Input, Card } from '../components/ui';

const MyForm = () => {
  return (
    <Card title="Formulário">
      <Input label="Nome" value={name} onChange={setName} />
      <Button variant="primary" loading={isLoading}>
        Salvar
      </Button>
    </Card>
  );
};
```

### 3. Rotas Protegidas
```tsx
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <Layout>
        <DashboardPage />
      </Layout>
    </ProtectedRoute>
  } 
/>
```

### 4. Hooks Customizados
```tsx
import useApi from '../hooks/useApi';

const MyComponent = () => {
  const { data, loading, error, execute } = useApi(apiFunction);
  // ...
};
```

## 🎨 Estilização

O projeto usa **Tailwind CSS** para estilização, com:
- Classes utilitárias para layout
- Sistema de cores consistente
- Componentes responsivos
- Estados de hover e focus

## 📱 Responsividade

Todos os componentes são responsivos e seguem as breakpoints do Tailwind:
- `sm`: 640px+
- `md`: 768px+
- `lg`: 1024px+
- `xl`: 1280px+
