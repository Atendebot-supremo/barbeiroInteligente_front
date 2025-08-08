// src/pages/CadastroPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const CadastroPage = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [telefone, setTelefone] = useState('');
  const [qtdBarbeiros, setQtdBarbeiros] = useState('');

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // errors
  const [errorNome, setErrorNome] = useState<string | undefined>();
  const [errorEmail, setErrorEmail] = useState<string | undefined>();
  const [errorPassword, setErrorPassword] = useState<string | undefined>();
  const [errorCnpj, setErrorCnpj] = useState<string | undefined>();
  const [errorTelefone, setErrorTelefone] = useState<string | undefined>();
  const [errorQtd, setErrorQtd] = useState<string | undefined>();
  const navigate = useNavigate();

  const validateStep1 = () => {
    let valid = true;
    setErrorNome(undefined);
    setErrorEmail(undefined);
    setErrorPassword(undefined);
    if (!nome.trim()) { setErrorNome('Informe o nome da barbearia'); valid = false; }
    if (!email.trim()) { setErrorEmail('Informe o email'); valid = false; }
    if (!password.trim()) { setErrorPassword('Informe a senha'); valid = false; }
    return valid;
  };

  const validateStep2 = () => {
    let valid = true;
    setErrorCnpj(undefined);
    setErrorTelefone(undefined);
    setErrorQtd(undefined);
    if (!cnpj.trim()) { setErrorCnpj('Informe o CNPJ'); valid = false; }
    if (!telefone.trim()) { setErrorTelefone('Informe o telefone'); valid = false; }
    if (!qtdBarbeiros.trim()) { setErrorQtd('Selecione a quantidade'); valid = false; }
    return valid;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => (s - 1) as 1 | 2 | 3);
  };

  const handleSubmit = () => {
    // Finalização figurativa
    console.log('Cadastro (simulado):', { nome, email, password, cnpj, telefone, qtdBarbeiros });
    alert('Cadastro realizado com sucesso! Você será redirecionado para o login.');
    navigate('/login');
  };

  return (
    <div
      className="min-h-screen flex items-start justify-center pt-10 pb-12 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundImage: "url('/src/assets/background-simples.png')",
        backgroundRepeat: 'repeat',
        backgroundSize: 'auto',
        backgroundColor: 'hsl(var(--color-bg-primary))',
      }}
    >
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img
            className="mx-auto h-20 w-auto"
            src="/src/assets/Logo - Barbeiro Inteligente - Sem Fundo.png"
            alt="Logo"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <h2 className="mt-6 text-3xl font-extrabold text-text-primary">Crie sua conta</h2>
          <p className="text-sm text-text-muted">Etapa 0{step} de 03</p>
          <p className="mt-2 text-sm text-text-muted">
            Já tem uma conta?{' '}
            <Link to="/login" className="font-medium text-primary hover:text-primary/80">
              Faça o login
            </Link>
          </p>
        </div>

        <Card className="bg-bg-secondary text-text-secondary border border-border">
          <form className="space-y-6">
            {step === 1 && (
              <>
                <Input
                  label="Nome da Barbearia"
                  type="text"
                  value={nome}
                  onChange={(v) => { setNome(v); if (errorNome) setErrorNome(undefined); }}
                  id="nome"
                  error={errorNome}
                  required
                />

                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(v) => { setEmail(v); if (errorEmail) setErrorEmail(undefined); }}
                  id="email"
                  error={errorEmail}
                  required
                />

                <Input
                  label="Senha"
                  type="password"
                  value={password}
                  onChange={(v) => { setPassword(v); if (errorPassword) setErrorPassword(undefined); }}
                  id="password"
                  error={errorPassword}
                  required
                />
              </>
            )}

            {step === 2 && (
              <>
                <Input
                  label="CNPJ"
                  type="text"
                  value={cnpj}
                  onChange={(v) => { setCnpj(v); if (errorCnpj) setErrorCnpj(undefined); }}
                  id="cnpj"
                  error={errorCnpj}
                  required
                />

                <Input
                  label="Telefone para contato"
                  type="tel"
                  value={telefone}
                  onChange={(v) => { setTelefone(v); if (errorTelefone) setErrorTelefone(undefined); }}
                  id="telefone"
                  error={errorTelefone}
                  required
                />

                <div>
                  <label htmlFor="qtd" className="block text-sm font-medium text-text-secondary mb-1">
                    Quantidade de barbeiros
                  </label>
                  <select
                    id="qtd"
                    value={qtdBarbeiros}
                    onChange={(e) => { setQtdBarbeiros(e.target.value); if (errorQtd) setErrorQtd(undefined); }}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${errorQtd ? 'border-danger-border' : 'border-border'} bg-white`}
                  >
                    <option value="">Selecione...</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5+">5+</option>
                  </select>
                  {errorQtd && (
                    <p className="mt-1 text-sm text-danger">{errorQtd}</p>
                  )}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-text-primary">Pagamento</h3>
                  <p className="text-sm text-text-muted">Configuração de pagamento será feita posteriormente.</p>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="border border-border rounded-md p-3 text-center">PIX</div>
                    <div className="border border-border rounded-md p-3 text-center">Cartão</div>
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center justify-between pt-2">
              <div>
                {step > 1 && (
                  <Button variant="outline" onClick={handleBack}>Voltar</Button>
                )}
              </div>
              <div>
                {step < 3 ? (
                  <Button variant="primary" onClick={handleNext}>Próxima etapa</Button>
                ) : (
                  <Button variant="primary" onClick={handleSubmit}>Finalizar cadastro</Button>
                )}
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CadastroPage;