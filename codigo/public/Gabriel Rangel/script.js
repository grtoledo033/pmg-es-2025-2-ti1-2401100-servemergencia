const API_BASE = "http://localhost:3000/fichas"; // json-server endpoint

// Utility to show alerts
function showMessage(msg) {
  const el = document.getElementById('resultado');
  el.innerHTML = `<p class="msg">${msg}</p>`;
  el.classList.add('mostrar');
  setTimeout(()=> el.classList.remove('mostrar'), 3000);
}

// Render a ficha card
function renderFichaCard(ficha) {
  return `
    <div class="card" data-id="${ficha.id}">
      <h4>${ficha.nome} <small>(${ficha.idade} anos)</small></h4>
      <p><strong>Sexo:</strong> ${ficha.sexo} · <strong>Tipo Sanguíneo:</strong> ${ficha.tipoSanguineo}</p>
      <p><strong>Alergias:</strong> ${ficha.alergias || 'Nenhuma'}</p>
      <p><strong>Doenças:</strong> ${ficha.doencas || 'Nenhuma'}</p>
      <p><strong>Medicamentos:</strong> ${ficha.medicamentos || 'Nenhum'}</p>
      <div class="actions">
        <button class="edit-btn">Editar</button>
        <button class="delete-btn">Excluir</button>
      </div>
    </div>
  `;
}

// Fetch and list fichas
async function loadFichas() {
  try {
    const res = await fetch(API_BASE);
    const data = await res.json();
    const list = document.getElementById('listaFichas');
    if (data.length === 0) list.innerHTML = "<p>Nenhuma ficha encontrada.</p>";
    else list.innerHTML = data.map(renderFichaCard).join("");
  } catch (err) {
    showMessage("Erro ao carregar fichas. Verifique se o json-server está rodando.");
    console.error(err);
  }
}

// Create or update ficha
async function saveFicha(ficha) {
  try {
    if (ficha.id) {
      // update
      const res = await fetch(`${API_BASE}/${ficha.id}`, {
        method: 'PUT',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(ficha)
      });
      if (!res.ok) throw new Error("Falha ao atualizar");
      showMessage("Ficha atualizada com sucesso.");
    } else {
      // create
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(ficha)
      });
      if (!res.ok) throw new Error("Falha ao criar");
      showMessage("Ficha criada com sucesso.");
    }
    await loadFichas();
  } catch (err) {
    showMessage("Erro ao salvar ficha.");
    console.error(err);
  }
}

// Delete ficha
async function deleteFicha(id) {
  if (!confirm("Deseja realmente excluir esta ficha?")) return;
  try {
    const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error("Falha ao excluir");
    showMessage("Ficha excluída.");
    await loadFichas();
  } catch (err) {
    showMessage("Erro ao excluir ficha.");
    console.error(err);
  }
}

// Populate form for editing
function populateForm(ficha) {
  const form = document.getElementById('fichaForm');
  form.dataset.id = ficha.id;
  form.nome.value = ficha.nome;
  form.idade.value = ficha.idade;
  form.sexo.value = ficha.sexo;
  form.tipoSanguineo.value = ficha.tipoSanguineo;
  form.alergias.value = ficha.alergias || '';
  form.doencas.value = ficha.doencas || '';
  form.medicamentos.value = ficha.medicamentos || '';
}

// Handle form submit
document.addEventListener('DOMContentLoaded', () => {
  loadFichas();

  const form = document.getElementById('fichaForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const ficha = {
      id: form.dataset.id || undefined,
      nome: (fd.get('nome') || '').trim(),
      idade: Number(fd.get('idade') || 0),
      sexo: fd.get('sexo'),
      tipoSanguineo: fd.get('tipoSanguineo'),
      alergias: (fd.get('alergias') || '').trim(),
      doencas: (fd.get('doencas') || '').trim(),
      medicamentos: (fd.get('medicamentos') || '').trim()
    };
    if (!ficha.nome || !ficha.idade || !ficha.sexo || !ficha.tipoSanguineo) {
      alert("Preencha os campos obrigatórios.");
      return;
    }
    await saveFicha(ficha);
    form.reset();
    delete form.dataset.id;
  });

  // Delegate edit/delete buttons
  document.getElementById('listaFichas').addEventListener('click', async (ev) => {
    const card = ev.target.closest('.card');
    if (!card) return;
    const id = card.dataset.id;
    if (ev.target.classList.contains('delete-btn')) {
      await deleteFicha(id);
    } else if (ev.target.classList.contains('edit-btn')) {
      // fetch ficha and populate
      try {
        const res = await fetch(`${API_BASE}/${id}`);
        const ficha = await res.json();
        populateForm(ficha);
        window.scrollTo({top:0, behavior:'smooth'});
      } catch (err) {
        showMessage("Erro ao buscar ficha para edição.");
        console.error(err);
      }
    }
  });

  // Search/filter
  document.getElementById('searchInput').addEventListener('input', async (e) => {
    const q = e.target.value.trim().toLowerCase();
    try {
      const res = await fetch(API_BASE);
      const data = await res.json();
      const filtered = data.filter(f => f.nome.toLowerCase().includes(q) || (f.tipoSanguineo||'').toLowerCase().includes(q));
      const list = document.getElementById('listaFichas');
      list.innerHTML = filtered.map(renderFichaCard).join("") || "<p>Nenhuma ficha encontrada.</p>";
    } catch (err) {
      console.error(err);
    }
  });
});

xxx