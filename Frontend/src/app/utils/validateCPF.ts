export function validateCPF(input: string): boolean {
  // Remove tudo que não for dígito
  const cpf = input.replace(/\D/g, '');
  if (cpf.length !== 11) return false;

  // CPF “todos iguais” não são válidos (ex: 00000000000, 11111111111 etc)
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  // Função que calcula cada dígito verificador
  const calcCheckDigit = (digits: string, factorStart: number) => {
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
      sum += parseInt(digits[i], 10) * (factorStart - i);
    }
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  // Primeiro dígito verificador (posição 9)
  const digit1 = calcCheckDigit(cpf.slice(0, 9), 10);
  if (digit1 !== parseInt(cpf[9], 10)) return false;

  // Segundo dígito verificador (posição 10)
  const digit2 = calcCheckDigit(cpf.slice(0, 10), 11);
  if (digit2 !== parseInt(cpf[10], 10)) return false;

  return true;
}
