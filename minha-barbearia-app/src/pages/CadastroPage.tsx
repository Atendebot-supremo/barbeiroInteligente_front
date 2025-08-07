// src/pages/CadastroPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const CadastroPage = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validação simples
    if (!nome || !email || !password) {
      setError('Todos os campos são obrigatórios.');
      return;
    }

    // --- LÓGICA FICTÍCIA ---
    // No futuro, aqui você chamaria o serviço de cadastro da sua API.
    // Por enquanto, vamos apenas simular um sucesso.
    console.log('Dados do cadastro:', { nome, email, password });
    alert('Cadastro realizado com sucesso! Você será redirecionado para o login.');
    navigate('/login');
    // --- FIM DA LÓGICA FICTÍCIA ---
  };

  return (
    <div>
      <h2>Crie sua Conta</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="nome">Nome da Barbearia:</label>
          <input type="text" id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div>
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="password">Senha:</label>
          <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Cadastrar</button>
      </form>
      <p>
        Já tem uma conta? <Link to="/login">Faça o login</Link>
      </p>
    </div>
  );
};

export default CadastroPage;