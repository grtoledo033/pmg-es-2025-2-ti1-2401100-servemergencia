document.getElementById('fichaForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const nome = document.getElementById('nome').value.trim();
  const idade = document.getElementById('idade').value.trim();
  const sexo = document.getElementById('sexo').value;
  const tipoSanguineo = document.getElementById('tipoSanguineo').value;
  const alergias = document.getElementById('alergias').value.trim();
  const doencas = document.getElementById('doencas').value.trim();
  const medicamentos = document.getElementById('medicamentos').value.trim();

  if (!nome || !idade || !sexo || !tipoSanguineo) {
    alert("Por favor, preencha todos os campos obrigatórios (*)");
    return;
  }

  const resultado = `
    <h3>Ficha Médica de ${nome}</h3>
    <p><strong>Idade:</strong> ${idade}</p>
    <p><strong>Sexo:</strong> ${sexo}</p>
    <p><strong>Tipo Sanguíneo:</strong> ${tipoSanguineo}</p>
    <p><strong>Alergias:</strong> ${alergias || 'Nenhuma'}</p>
    <p><strong>Doenças Pré-Existentes:</strong> ${doencas || 'Nenhuma'}</p>
    <p><strong>Medicamentos em uso:</strong> ${medicamentos || 'Nenhum'}</p>
  `;

  const divResultado = document.getElementById('resultado');
  divResultado.innerHTML = resultado;
  divResultado.style.display = 'block';
});