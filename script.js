document.addEventListener('DOMContentLoaded', () => {
    
    // --- ACCORDION LOGIC ---
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const content = item.querySelector('.accordion-content');
            const isActive = item.classList.contains('active');
            
            // Close all
            document.querySelectorAll('.accordion-item').forEach(otherItem => {
                otherItem.classList.remove('active');
                otherItem.querySelector('.accordion-content').style.maxHeight = null;
            });
            
            // Open clicked if it wasn't active
            if (!isActive) {
                item.classList.add('active');
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    });

    // --- QUESTIONNAIRE LOGIC ---
    const questions = [
        {
            id: 'q1',
            title: 'Avez-vous déjà des prothèses mammaires ?',
            options: [
                { text: 'Oui, j\'ai déjà des implants', next: 'q2', icon: 'ph-check-circle' },
                { text: 'Non, je n\'en ai jamais eu', next: 'q3', icon: 'ph-x-circle' }
            ]
        },
        {
            id: 'q2',
            title: 'Quel est votre souhait actuel pour votre poitrine ?',
            options: [
                { text: 'Changer la taille ou la forme des implants', protocol: 'changement_protheses', icon: 'ph-arrows-clockwise' },
                { text: 'Retirer définitivement les implants', protocol: 'retrait_protheses', icon: 'ph-minus-circle' },
                { text: 'Changer les implants et remonter la poitrine (affaissement)', protocol: 'changement_lifting', icon: 'ph-arrow-circle-up' }
            ]
        },
        {
            id: 'q3',
            title: 'Quel est votre objectif principal ?',
            options: [
                { text: 'Augmenter le volume avec des implants', next: 'q4', icon: 'ph-arrows-out' },
                { text: 'Remonter la poitrine (sans ajouter de volume)', protocol: 'lifting', icon: 'ph-arrow-up' },
                { text: 'Augmenter très légèrement avec un résultat 100% naturel (Lipofilling)', next: 'q_lipofilling_zones', icon: 'ph-drop' }
            ]
        },
        {
            id: 'q4',
            title: 'Votre poitrine présente-t-elle un affaissement important (les mamelons regardent vers le bas) ?',
            options: [
                { text: 'Non, ma poitrine ne tombe pas (ou très peu)', protocol: 'augmentation_simple', icon: 'ph-thumbs-up' },
                { text: 'Oui, ma poitrine est affaissée (ptôse) et je souhaite la remonter au passage', protocol: 'augmentation_lifting', icon: 'ph-arrows-up-down' }
            ]
        },
        {
            id: 'q_lipofilling_zones',
            title: 'Combien de zones de prélèvement de graisse souhaitez-vous inclure ?',
            isZoneSelector: true
        }
    ];

    const protocols = {
        'augmentation_simple': {
            name: 'Augmentation mammaire simple (prothèses)',
            priceTTC: 3500,
            desc: 'Augmentation du volume de la poitrine avec mise en place d\'implants mammaires.'
        },
        'augmentation_lifting': {
            name: 'Augmentation mammaire + Lifting (prothèses)',
            priceTTC: 4500,
            desc: 'Remodelage consistant à remonter la poitrine affaissée tout en plaçant des implants pour augmenter le volume.'
        },
        'lifting': {
            name: 'Lifting Mammaire',
            priceTTC: 3500,
            desc: 'Intervention visant à remonter une poitrine tombante pour lui redonner sa forme et son maintien naturel, sans utilisation de prothèses.'
        },
        'changement_protheses': {
            name: 'Changement de prothèses seules',
            priceTTC: 2900,
            desc: 'Remplacement de vos anciens implants par de nouveaux (modification de taille, forme ou type de prothèse possible).'
        },
        'changement_lifting': {
            name: 'Changement de prothèses + Lifting',
            priceTTC: 3900,
            desc: 'Remplacement de vos implants associé à un lifting pour corriger l\'affaissement de la poitrine.'
        },
        'retrait_protheses': {
            name: 'Retrait de prothèses',
            priceTTC: 3500,
            desc: 'Intervention pour retirer définitivement vos implants mammaires actuels.'
        },
        'lipofilling': {
            name: 'Lipofilling seins',
            basePriceTTC: 2500,
            zoneSupplementTTC: 968,
            priceTTC: 2500, // Will be dynamically computed
            desc: 'Augmentation mammaire 100% naturelle utilisant votre propre graisse.'
        }
    };

    let history = [];
    const container = document.getElementById('questionContainer');
    const resultContainer = document.getElementById('resultContainer');
    const progressFill = document.getElementById('progressFill');
    let currentProtocol = null;
    let lipofillingZones = 1;

    // Initialize Questionnaire
    renderQuestion('q1');

    function getProgressPercent() {
        const maxSteps = 4; // max depth of the tree
        const percent = Math.min(100, Math.round(((history.length + 1) / maxSteps) * 100));
        return percent + '%';
    }

    function renderQuestion(qId) {
        const question = questions.find(q => q.id === qId);
        if (!question) return;

        container.innerHTML = '';
        container.style.display = 'block';
        progressFill.style.width = getProgressPercent();

        // Special handler for lipofilling zone selector
        if (question.isZoneSelector) {
            renderZoneSelector(question);
            return;
        }

        const stepDiv = document.createElement('div');
        stepDiv.className = 'question-step active';
        
        let html = `<h3>${question.title}</h3><div class="options-grid">`;
        
        question.options.forEach((opt, index) => {
            html += `
                <div class="option-card neumorphic" data-index="${index}">
                    <i class="ph-light ${opt.icon}"></i>
                    <h4>${opt.text}</h4>
                </div>
            `;
        });
        
        html += `</div>`;
        if (history.length > 0) {
            html += `<button class="btn btn-outline" id="btnBack"><i class="ph-light ph-arrow-left"></i> Retour</button>`;
        }

        stepDiv.innerHTML = html;
        container.appendChild(stepDiv);

        // Add event listeners to cards
        const cards = stepDiv.querySelectorAll('.option-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                // Visual feedback
                cards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                
                const opt = question.options[card.dataset.index];
                
                setTimeout(() => {
                    history.push(qId);
                    if (opt.protocol) {
                        showResult(opt.protocol);
                    } else if (opt.next) {
                        renderQuestion(opt.next);
                    }
                }, 200);
            });
        });

        // Back button
        const btnBack = stepDiv.querySelector('#btnBack');
        if (btnBack) {
            btnBack.addEventListener('click', () => {
                const prev = history.pop();
                renderQuestion(prev);
            });
        }
    }

    function renderZoneSelector(question) {
        lipofillingZones = 1;
        const stepDiv = document.createElement('div');
        stepDiv.className = 'question-step active';
        
        stepDiv.innerHTML = `
            <h3>${question.title}</h3>
            <p style="text-align:center; margin-bottom: 5px;">Chaque zone de prélèvement correspond à une partie du corps d'où sera extraite la graisse (ventre, hanches, cuisses, etc.).</p>
            <div class="zone-selector neumorphic">
                <label>Nombre de zones de prélèvement :</label>
                <div class="zone-counter">
                    <button id="zoneMinus" type="button">−</button>
                    <span id="zoneCount">1</span>
                    <button id="zonePlus" type="button">+</button>
                </div>
                <p class="zone-hint">
                    Base : 2 500 € TVAC + 968 € TVAC par zone supplémentaire<br>
                    <strong>Estimation : <span id="lipoEstimate">2 500,00 €</span> TVAC</strong>
                </p>
            </div>
            <div style="text-align:center; margin-top:20px; display:flex; gap:15px; justify-content:center; flex-wrap:wrap;">
                <button class="btn btn-outline" id="btnBack"><i class="ph-light ph-arrow-left"></i> Retour</button>
                <button class="btn btn-primary" id="btnConfirmLipo"><i class="ph-light ph-check"></i> Confirmer</button>
            </div>
        `;
        container.appendChild(stepDiv);

        const zoneCountEl = document.getElementById('zoneCount');
        const lipoEstimateEl = document.getElementById('lipoEstimate');
        
        function updateLipoEstimate() {
            const total = 2500 + (lipofillingZones - 1) * 968;
            lipoEstimateEl.textContent = formatPrice(total);
        }

        document.getElementById('zoneMinus').addEventListener('click', () => {
            if (lipofillingZones > 1) {
                lipofillingZones--;
                zoneCountEl.textContent = lipofillingZones;
                updateLipoEstimate();
            }
        });

        document.getElementById('zonePlus').addEventListener('click', () => {
            if (lipofillingZones < 6) {
                lipofillingZones++;
                zoneCountEl.textContent = lipofillingZones;
                updateLipoEstimate();
            }
        });

        document.getElementById('btnConfirmLipo').addEventListener('click', () => {
            // Update the lipofilling protocol price dynamically
            protocols.lipofilling.priceTTC = 2500 + (lipofillingZones - 1) * 968;
            protocols.lipofilling.desc = `Augmentation mammaire 100% naturelle utilisant votre propre graisse, prélevée sur ${lipofillingZones} zone(s) de votre corps.`;
            history.push('q_lipofilling_zones');
            showResult('lipofilling');
        });

        document.getElementById('btnBack').addEventListener('click', () => {
            const prev = history.pop();
            renderQuestion(prev);
        });
    }

    function formatPrice(num) {
        return new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' }).format(num);
    }

    function showResult(protocolId) {
        container.style.display = 'none';
        resultContainer.classList.remove('hidden');
        progressFill.style.width = '100%';

        currentProtocol = protocols[protocolId];
        
        // Calculate prices (TTC / 1.21 = HT)
        const priceTVA_rate = 0.21;
        const ttc = currentProtocol.priceTTC;
        const ht = ttc / (1 + priceTVA_rate);
        const tva = ttc - ht;

        // Populate DOM for web view
        document.getElementById('resProtocolName').textContent = currentProtocol.name;
        document.getElementById('resProtocolDesc').textContent = currentProtocol.desc;
        document.getElementById('priceHT').textContent = formatPrice(ht);
        document.getElementById('priceTVA').textContent = formatPrice(tva);
        document.getElementById('priceTTC').textContent = formatPrice(ttc);

        // Populate PDF Template
        document.getElementById('pdfProtocolTitle').textContent = currentProtocol.name;
        document.getElementById('pdfProtocolDesc').textContent = currentProtocol.desc;
        document.getElementById('pdfHT').textContent = formatPrice(ht);
        document.getElementById('pdfTVA').textContent = formatPrice(tva);
        document.getElementById('pdfTTC').textContent = formatPrice(ttc);
        
        const now = new Date();
        document.getElementById('pdfDate').textContent = now.toLocaleDateString('fr-BE');
    }

    // --- RESTART BUTTON ---
    document.getElementById('btnRestart').addEventListener('click', () => {
        history = [];
        lipofillingZones = 1;
        resultContainer.classList.add('hidden');
        container.style.display = 'block';
        renderQuestion('q1');
        // Clear user form
        document.getElementById('userDataForm').reset();
    });

    // --- FORM & PDF LOGIC ---
    const userForm = document.getElementById('userDataForm');
    const modal = document.getElementById('postDownloadModal');
    const pdfTemplate = document.getElementById('pdfTemplate');

    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('userName').value;
        const email = document.getElementById('userEmail').value;
        const phone = document.getElementById('userPhone').value;
        
        // Change button state
        const btn = document.getElementById('btnDownloadPDF');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="ph-light ph-spinner"></i> Génération en cours...';
        btn.disabled = true;

        // Fill PDF template with user data
        document.getElementById('pdfName').textContent = name;
        document.getElementById('pdfEmail').textContent = email;
        document.getElementById('pdfPhone').textContent = phone;

        // Generate PDF using html2canvas & jsPDF
        try {
            const canvas = await html2canvas(pdfTemplate, {
                scale: 2, 
                backgroundColor: '#ffffff',
                useCORS: true
            });
            
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            
            // A4 is 210x297mm
            const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Devis_Churchill_${name.replace(/\s+/g, '_')}.pdf`);
            
            // Prepare the post-download modal with pre-filled data
            document.getElementById('contactName').value = name;
            document.getElementById('contactEmail').value = email;
            document.getElementById('contactPhone').value = phone;

            // Show modal after a brief delay
            setTimeout(() => {
                modal.classList.remove('hidden');
            }, 500);

        } catch (error) {
            console.error("Erreur lors de la génération du PDF", error);
            alert("Une erreur est survenue lors de la création de votre devis. Veuillez réessayer.");
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });

    // --- MODAL LOGIC ---
    const closeModalBtn = document.getElementById('closeModalBtn');
    closeModalBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    // Close modal on overlay click (outside the modal content)
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });

    // --- CONTACT FORM ---
    const contactForm = document.getElementById('contactForm');
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // In production, connect this to Formspree, Make, or Zapier webhook
        alert('Votre message a bien été envoyé ! Notre équipe vous contactera rapidement aux coordonnées renseignées dans votre devis.');
        modal.classList.add('hidden');
        contactForm.reset();
    });

    // --- CHATBOT BUTTON ---
    document.getElementById('chatbotBtn').addEventListener('click', (e) => {
        e.preventDefault();
        // Placeholder: redirect to chatbot integration
        alert('Redirection vers le chatbot / agent humain.\n\nCette fonctionnalité sera intégrée prochainement.');
    });
});
