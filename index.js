document.addEventListener('DOMContentLoaded', () => {
    const HIGHLIGHT_WORDS = [
      /\bсрочно\b/gi,
      /\bбыстрее\b/gi,
      /\bпобыстрее\b/gi,
      /\bскорее\b/gi,
      /\bпоскорее\b/gi,
      /\bочень нужно\b/gi,
    ];
  
    const elements = {
      form: document.querySelector('form'),
      addButton: document.querySelector('.add-button'),
    };
  
    const createElement = (tag, props = {}) => Object.assign(document.createElement(tag), props);
  
    elements.form.addEventListener('submit', (event) => {
      event.preventDefault();
      displayOrderModal();
    });
  
    const enhanceFieldset = (fieldset) => {
      const wrapper = createElement('div', { className: 'wish-wrapper' });
      const label = createElement('label', { className: 'wish-label', textContent: 'И еще вот что' });
      const textarea = createElement('textarea', { className: 'wish-input', rows: 2 });
      const live = createElement('div', { className: 'wish-live', ariaLive: 'polite' });
  
      textarea.addEventListener('input', () => {
        live.innerHTML = HIGHLIGHT_WORDS.reduce(
          (text, regex) => text.replace(regex, (match) => `<b>${match}</b>`),
          textarea.value
        );
      });
  
      wrapper.append(label, textarea, live);
      fieldset.append(wrapper);
    };
  
    const reindexBeverages = () => {
      elements.form.querySelectorAll('fieldset.beverage').forEach((fieldset, index) => {
        const idx = index + 1;
        fieldset.querySelector('.beverage-count').textContent = `Напиток №${idx}`;
        fieldset.querySelectorAll('input[type="radio"]').forEach((radio) => {
          radio.name = `milk-${idx}`;
        });
        fieldset.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
          checkbox.name = `options-${idx}`;
        });
        const wishInput = fieldset.querySelector('.wish-input');
        if (wishInput) {
          wishInput.id = `wish-${idx}`;
          fieldset.querySelector('.wish-live').id = `wish-live-${idx}`;
        }
      });
    };
  
    const addRemoveButton = (fieldset) => {
      fieldset.classList.add('beverage-item');
      const button = createElement('button', {
        type: 'button',
        className: 'remove-beverage',
        innerHTML: '×',
      });
      button.addEventListener('click', () => {
        if (elements.form.querySelectorAll('fieldset.beverage').length > 1) {
          fieldset.remove();
          reindexBeverages();
        }
      });
      fieldset.append(button);
    };
  
    const initialBeverage = elements.form.querySelector('fieldset.beverage');
    addRemoveButton(initialBeverage);
    enhanceFieldset(initialBeverage);
    reindexBeverages();
  
    elements.addButton.addEventListener('click', () => {
      const template = elements.form.querySelector('fieldset.beverage').cloneNode(true);
      template.querySelectorAll('input[type="radio"]').forEach((radio, i) => {
        radio.checked = i === 0;
      });
      template.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
        checkbox.checked = false;
      });
      template.querySelector('.remove-beverage')?.remove();
      template.querySelector('.wish-wrapper')?.remove();
  
      addRemoveButton(template);
      enhanceFieldset(template);
      elements.form.insertBefore(template, elements.addButton.parentElement);
      reindexBeverages();
    });
  
    const buildOrderTable = (beverages) => {
      const table = createElement('table', { className: 'order-table' });
      const thead = createElement('thead');
      const headerRow = createElement('tr');
      ['Напиток', 'Молоко', 'Дополнительно', 'Пожелания'].forEach((text) => {
        headerRow.append(createElement('th', { className: 'order-header', textContent: text }));
      });
      thead.append(headerRow);
      table.append(thead);
  
      const tbody = createElement('tbody');
      beverages.forEach((fieldset) => {
        const row = createElement('tr');
        const cells = [
          fieldset.querySelector('select').selectedOptions[0].textContent,
          fieldset.querySelector('input[type="radio"]:checked')?.closest('label').querySelector('span').textContent || '',
          Array.from(fieldset.querySelectorAll('input[type="checkbox"]:checked'))
            .map((ch) => ch.nextElementSibling.textContent.trim())
            .join(', '),
          fieldset.querySelector('.wish-live').innerHTML,
        ];
        cells.forEach((content, i) => {
          const td = createElement('td', { className: 'order-cell' });
          if (i === 3) td.innerHTML = content;
          else td.textContent = content;
          row.append(td);
        });
        tbody.append(row);
      });
      table.append(tbody);
      return table;
    };
  
    const displayOrderModal = () => {
      reindexBeverages();
      const beverages = Array.from(elements.form.querySelectorAll('fieldset.beverage'));
      const count = beverages.length;
      const word = declensionDrink(count, ['напиток', 'напитка', 'напитков']);
      const message = `Вы заказали ${count} ${word}`;
  
      const overlay = createElement('div', { className: 'modal-overlay' });
      const modal = createElement('div', { className: 'modal-window' });
      const closeBtn = createElement('button', {
        type: 'button',
        className: 'modal-close',
        innerHTML: '×',
      });
      closeBtn.addEventListener('click', () => overlay.remove());
      const messageP = createElement('p', { className: 'modal-message', textContent: message });
  
      const timeWrapper = createElement('div', { className: 'time-wrapper' });
      const timeLabel = createElement('label', { textContent: 'Выберите время заказа' });
      const timeInput = createElement('input', { type: 'time', className: 'time-input' });
      timeWrapper.append(timeLabel, timeInput);
  
      const orderBtn = createElement('button', {
        type: 'button',
        className: 'order-button',
        textContent: 'Оформить',
      });
      orderBtn.addEventListener('click', () => {
        const selected = timeInput.value;
        if (!selected) return;
        const [hh, mm] = selected.split(':').map(Number);
        const now = new Date();
        const selDate = new Date();
        selDate.setHours(hh, mm, 0, 0);
        if (selDate < now) {
          timeInput.classList.add('time-error');
          alert('Мы не умеем перемещаться во времени. Выберите время позже, чем текущее');
        } else {
          overlay.remove();
        }
      });
  
      modal.append(closeBtn, messageP, buildOrderTable(beverages), timeWrapper, orderBtn);
      overlay.append(modal);
      document.body.append(overlay);
    };
  
    const declensionDrink = (n, forms) => {
      const abs = Math.abs(n) % 100;
      const last = abs % 10;
      if (abs > 10 && abs < 20) return forms[2];
      if (last > 1 && last < 5) return forms[1];
      if (last === 1) return forms[0];
      return forms[2];
    };
  });