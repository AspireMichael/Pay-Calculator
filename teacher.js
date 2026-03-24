// ===== Teacher Pay Calculator – 2025/26 (England, excl. London) =====
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const formatCurrency = (n) => '£' + Math.abs(n).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };

// ===== 2025/26 Tax & NI Constants =====
const TAX = {
    personalAllowance: 12570,
    basicRateLimit: 50270,
    higherRateLimit: 125140,
    basicRate: 0.20,
    higherRate: 0.40,
    additionalRate: 0.45,
    paThreshold: 100000,
};

const EMPLOYEE_NI = {
    primaryThreshold: 12570,
    upperEarningsLimit: 50270,
    basicRate: 0.08,
    higherRate: 0.02,
};

const STUDENT_LOANS = {
    plan1: { threshold: 24990, rate: 0.09 },
    plan2: { threshold: 27295, rate: 0.09 },
    plan4: { threshold: 31395, rate: 0.09 },
    plan5: { threshold: 25000, rate: 0.09 },
    postgrad: { threshold: 21000, rate: 0.06 },
};

// ===== Teacher Pay Scales 2025/26 – All regions (4% uplift) =====
const TEACHER_PAY = {
    england: {
        label: 'Rest of England',
        M1: 32916, M2: 34823, M3: 37101, M4: 39556, M5: 42057, M6: 45352,
        UPS1: 47472, UPS2: 49232, UPS3: 51048,
        L1: 51834, L2: 53104, L3: 54403, L4: 55728, L5: 57089,
        L6: 58491, L7: 60038, L8: 61398, L9: 62903, L10: 64490,
        L11: 66135, L12: 67635, L13: 69300, L14: 70998, L15: 72738,
        L16: 74642, L17: 76331, L18: 78223, L19: 80655, L20: 82654,
        L21: 84699, L22: 86803, L23: 88951, L24: 91158, L25: 93424,
        L26: 95735, L27: 98106, L28: 100540, L29: 103030, L30: 105595,
        L31: 108202, L32: 110892, L33: 113646, L34: 116456, L35: 119350,
        L36: 122306, L37: 125345, L38: 128447, L39: 131578, L40: 134860,
        L41: 138230, L42: 141693, L43: 143796,
    },
    fringe: {
        label: 'London Fringe',
        M1: 34398, M2: 36305, M3: 38583, M4: 41038, M5: 43539, M6: 46839,
        UPS1: 48913, UPS2: 50673, UPS3: 52490,
        L1: 53198, L2: 54468, L3: 55767, L4: 57092, L5: 58453,
        L6: 59855, L7: 61402, L8: 62762, L9: 64267, L10: 65854,
        L11: 67499, L12: 68999, L13: 70664, L14: 72362, L15: 74102,
        L16: 76006, L17: 77695, L18: 79587, L19: 82019, L20: 84018,
        L21: 86063, L22: 88167, L23: 90315, L24: 92522, L25: 94788,
        L26: 97099, L27: 99470, L28: 101904, L29: 104394, L30: 106959,
        L31: 109566, L32: 112256, L33: 115010, L34: 117820, L35: 120714,
        L36: 123670, L37: 126709, L38: 129811, L39: 132942, L40: 136224,
        L41: 139594, L42: 143057, L43: 145218,
    },
    outer: {
        label: 'Outer London',
        M1: 37870, M2: 39777, M3: 42055, M4: 44510, M5: 47011, M6: 50474,
        UPS1: 52219, UPS2: 53979, UPS3: 56154,
        L1: 55881, L2: 57151, L3: 58450, L4: 59775, L5: 61136,
        L6: 62538, L7: 64085, L8: 65445, L9: 66950, L10: 68537,
        L11: 70182, L12: 71682, L13: 73347, L14: 75045, L15: 76785,
        L16: 78689, L17: 80378, L18: 82270, L19: 84702, L20: 86701,
        L21: 88746, L22: 90850, L23: 92998, L24: 95205, L25: 97471,
        L26: 99782, L27: 102153, L28: 104587, L29: 107077, L30: 109642,
        L31: 112249, L32: 114939, L33: 117693, L34: 120503, L35: 123397,
        L36: 126353, L37: 129392, L38: 132494, L39: 135625, L40: 138907,
        L41: 142277, L42: 145740, L43: 147866,
    },
    inner: {
        label: 'Inner London',
        M1: 40317, M2: 42524, M3: 44499, M4: 46547, M5: 50040, M6: 52300,
        UPS1: 56199, UPS2: 58131, UPS3: 62496,
        L1: 61554, L2: 62824, L3: 64123, L4: 65448, L5: 66809,
        L6: 68211, L7: 69758, L8: 71118, L9: 72623, L10: 74210,
        L11: 75855, L12: 77355, L13: 79020, L14: 80718, L15: 82458,
        L16: 84362, L17: 86051, L18: 87943, L19: 90375, L20: 92374,
        L21: 94419, L22: 96523, L23: 98671, L24: 100878, L25: 103144,
        L26: 105455, L27: 107826, L28: 110260, L29: 112750, L30: 115315,
        L31: 117922, L32: 120612, L33: 123366, L34: 126176, L35: 129070,
        L36: 132026, L37: 135065, L38: 138167, L39: 141298, L40: 144580,
        L41: 147950, L42: 151413, L43: 153490,
    },
};

// TLR Payments 2025/26 (4% uplift)
const TLR_PAYMENTS = {
    none: { label: 'None', amount: 0 },
    tlr2_min: { label: 'TLR 2 (Min) – £3,527', amount: 3527 },
    tlr2_mid: { label: 'TLR 2 (Mid) – £6,069', amount: 6069 },
    tlr2_max: { label: 'TLR 2 (Max) – £8,611', amount: 8611 },
    tlr1_min: { label: 'TLR 1 (Min) – £10,174', amount: 10174 },
    tlr1_mid: { label: 'TLR 1 (Mid) – £13,695', amount: 13695 },
    tlr1_max: { label: 'TLR 1 (Max) – £17,216', amount: 17216 },
};

// SEN Allowance 2025/26 (4% uplift)
const SEN_ALLOWANCE = {
    none: { label: 'None', amount: 0 },
    min: { label: 'SEN Min – £2,787', amount: 2787 },
    max: { label: 'SEN Max – £5,497', amount: 5497 },
};

// ===== Teachers' Pension Scheme (TPS) =====
const TPS = {
    employerRate: 0.2868, // 28.68% employer
    // Employee tiered rates (2024/25 thresholds – updated annually in April)
    employeeTiers: [
        { threshold: 34290, rate: 0.074 },
        { threshold: 46159, rate: 0.086 },
        { threshold: 54730, rate: 0.096 },
        { threshold: 72535, rate: 0.102 },
        { threshold: 98909, rate: 0.113 },
        { threshold: Infinity, rate: 0.117 },
    ],
};

function getTPSEmployeeRate(salary) {
    for (const tier of TPS.employeeTiers) {
        if (salary < tier.threshold) return tier.rate;
    }
    return TPS.employeeTiers[TPS.employeeTiers.length - 1].rate;
}

// ===== Calculation Functions =====
function calculateIncomeTax(grossSalary, pensionEmployee) {
    const taxableSalary = grossSalary - pensionEmployee;
    let pa = TAX.personalAllowance;
    if (taxableSalary > TAX.paThreshold) {
        pa = Math.max(0, TAX.personalAllowance - (taxableSalary - TAX.paThreshold) / 2);
    }

    const taxable = Math.max(0, taxableSalary - pa);
    let tax = 0;
    const basicBand = Math.max(0, TAX.basicRateLimit - pa);
    const higherBand = TAX.higherRateLimit - TAX.basicRateLimit;

    if (taxable <= basicBand) {
        tax = taxable * TAX.basicRate;
    } else if (taxable <= basicBand + higherBand) {
        tax = basicBand * TAX.basicRate;
        tax += (taxable - basicBand) * TAX.higherRate;
    } else {
        tax = basicBand * TAX.basicRate;
        tax += higherBand * TAX.higherRate;
        tax += (taxable - basicBand - higherBand) * TAX.additionalRate;
    }
    return Math.round(tax * 100) / 100;
}

function calculateEmployeeNI(grossSalary) {
    if (grossSalary <= EMPLOYEE_NI.primaryThreshold) return 0;
    let ni = 0;
    if (grossSalary <= EMPLOYEE_NI.upperEarningsLimit) {
        ni = (grossSalary - EMPLOYEE_NI.primaryThreshold) * EMPLOYEE_NI.basicRate;
    } else {
        ni = (EMPLOYEE_NI.upperEarningsLimit - EMPLOYEE_NI.primaryThreshold) * EMPLOYEE_NI.basicRate;
        ni += (grossSalary - EMPLOYEE_NI.upperEarningsLimit) * EMPLOYEE_NI.higherRate;
    }
    return Math.round(ni * 100) / 100;
}

function calculateStudentLoan(grossSalary, plans) {
    let total = 0;
    for (const plan of plans) {
        const sl = STUDENT_LOANS[plan];
        if (sl && grossSalary > sl.threshold) {
            total += (grossSalary - sl.threshold) * sl.rate;
        }
    }
    return Math.round(total * 100) / 100;
}

function calculateChildBenefitCharge(adjustedIncome, numChildren) {
    if (numChildren <= 0 || adjustedIncome <= 60000) return 0;
    const weeklyBase = numChildren >= 1 ? 26.05 : 0;
    const weeklyExtra = Math.max(0, numChildren - 1) * 17.25;
    const annualBenefit = (weeklyBase + weeklyExtra) * 52;
    if (adjustedIncome >= 80000) return annualBenefit;
    const fraction = (adjustedIncome - 60000) / 20000;
    return Math.round(annualBenefit * fraction * 100) / 100;
}

function calculateMarginalRate(salary, slPlans) {
    let marginalIncomeTax = 0;
    let marginalNI = 0;
    let marginalSL = 0;

    let pa = TAX.personalAllowance;
    if (salary > TAX.paThreshold) {
        pa = Math.max(0, TAX.personalAllowance - (salary - TAX.paThreshold) / 2);
    }
    const taxable = Math.max(0, salary - pa);
    const basicBand = Math.max(0, TAX.basicRateLimit - pa);

    if (salary > TAX.paThreshold && pa > 0) {
        marginalIncomeTax = 0.60;
    } else if (taxable <= basicBand) {
        marginalIncomeTax = salary > pa ? TAX.basicRate : 0;
    } else if (taxable <= basicBand + (TAX.higherRateLimit - TAX.basicRateLimit)) {
        marginalIncomeTax = TAX.higherRate;
    } else {
        marginalIncomeTax = TAX.additionalRate;
    }

    if (salary > EMPLOYEE_NI.primaryThreshold && salary <= EMPLOYEE_NI.upperEarningsLimit) {
        marginalNI = EMPLOYEE_NI.basicRate;
    } else if (salary > EMPLOYEE_NI.upperEarningsLimit) {
        marginalNI = EMPLOYEE_NI.higherRate;
    }

    for (const plan of slPlans) {
        const sl = STUDENT_LOANS[plan];
        if (sl && salary > sl.threshold) {
            marginalSL += sl.rate;
        }
    }

    return Math.min(marginalIncomeTax + marginalNI + marginalSL, 1);
}

// ===== Theme =====
function initTheme() {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    document.getElementById('theme-toggle').addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    });
}

// ===== Pension Toggle =====
function getPensionAmounts(salary) {
    const isTPS = $('#pension-tps').classList.contains('active');
    if (isTPS) {
        const rate = getTPSEmployeeRate(salary);
        return {
            employeeRate: rate,
            employee: Math.round(salary * rate * 100) / 100,
            employer: Math.round(salary * TPS.employerRate * 100) / 100,
            isTPS: true,
        };
    } else {
        const empPct = parseFloat($('#custom-pension-employee').value) || 0;
        const erPct = parseFloat($('#custom-pension-employer').value) || 0;
        return {
            employeeRate: empPct / 100,
            employee: Math.round(salary * (empPct / 100) * 100) / 100,
            employer: Math.round(salary * (erPct / 100) * 100) / 100,
            isTPS: false,
        };
    }
}

// ===== Get selected region =====
function getSelectedRegion() {
    const checked = document.querySelector('input[name="region"]:checked');
    return checked ? checked.value : 'england';
}

// ===== Populate pay scale dropdown for selected region =====
function populatePayScaleDropdown() {
    const region = getSelectedRegion();
    const payScales = TEACHER_PAY[region];
    const select = $('#pay-scale');
    const currentValue = select.value;
    select.innerHTML = '';

    const fmt = n => '£' + n.toLocaleString('en-GB');

    const groups = [
        { label: 'Main Pay Range', keys: ['M1','M2','M3','M4','M5','M6'] },
        { label: 'Upper Pay Scale', keys: ['UPS1','UPS2','UPS3'] },
        { label: 'Leadership', keys: [] },
        { label: 'Other', keys: ['custom'] },
    ];

    // Build leadership keys dynamically (L1 to L43)
    for (let i = 1; i <= 43; i++) {
        if (payScales['L' + i] !== undefined) groups[2].keys.push('L' + i);
    }

    for (const group of groups) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = group.label;
        for (const key of group.keys) {
            const option = document.createElement('option');
            option.value = key;
            if (key === 'custom') {
                option.textContent = 'Custom Salary…';
            } else {
                option.textContent = `${key} – ${fmt(payScales[key])}`;
            }
            optgroup.appendChild(option);
        }
        select.appendChild(optgroup);
    }

    // Restore selection if it still exists
    if (currentValue && select.querySelector(`option[value="${currentValue}"]`)) {
        select.value = currentValue;
    }

    // Update sidebar reference
    updateSidebarScales(payScales, TEACHER_PAY[region].label);
}

function updateSidebarScales(payScales, regionLabel) {
    const container = $('#sidebar-scales');
    if (!container) return;
    const fmt = n => '£' + n.toLocaleString('en-GB');
    container.innerHTML = `
        <div class="ref-row"><span>M1</span><span>${fmt(payScales.M1)}</span></div>
        <div class="ref-row"><span>M6</span><span>${fmt(payScales.M6)}</span></div>
        <div class="ref-row"><span>UPS1</span><span>${fmt(payScales.UPS1)}</span></div>
        <div class="ref-row"><span>UPS3</span><span>${fmt(payScales.UPS3)}</span></div>
        <div class="ref-row"><span>L1</span><span>${fmt(payScales.L1)}</span></div>
        <div class="ref-row"><span>L18</span><span>${fmt(payScales.L18)}</span></div>
        <div class="ref-row"><span>L43</span><span>${fmt(payScales.L43)}</span></div>
    `;
}

// ===== Update salary display =====
function updateSalaryFromScale() {
    const region = getSelectedRegion();
    const payScales = TEACHER_PAY[region];
    const scaleValue = $('#pay-scale').value;
    const tlrValue = $('#tlr-payment').value;
    const senValue = $('#sen-allowance').value;

    let baseSalary = 0;
    if (scaleValue && scaleValue !== 'custom') {
        baseSalary = payScales[scaleValue] || 0;
    } else if (scaleValue === 'custom') {
        baseSalary = parseFloat($('#custom-salary').value) || 0;
    }

    const tlr = TLR_PAYMENTS[tlrValue] ? TLR_PAYMENTS[tlrValue].amount : 0;
    const sen = SEN_ALLOWANCE[senValue] ? SEN_ALLOWANCE[senValue].amount : 0;
    const total = baseSalary + tlr + sen;

    setText('salary-base-display', formatCurrency(baseSalary));
    setText('salary-tlr-display', tlr > 0 ? `+ ${formatCurrency(tlr)}` : '–');
    setText('salary-sen-display', sen > 0 ? `+ ${formatCurrency(sen)}` : '–');
    setText('salary-total-display', formatCurrency(total));

    const customGroup = $('#custom-salary-group');
    if (scaleValue === 'custom') {
        customGroup.style.display = 'block';
    } else {
        customGroup.style.display = 'none';
    }

    return total;
}

// ===== Main Calculation =====
function calculateTeacher() {
    const salary = updateSalaryFromScale();
    if (salary <= 0) return;

    // Pension
    const pension = getPensionAmounts(salary);
    const pensionEmployee = pension.employee;
    const pensionEmployer = pension.employer;

    // Student loans
    const slPlans = [];
    if ($('#sl-plan1').checked) slPlans.push('plan1');
    if ($('#sl-plan2').checked) slPlans.push('plan2');
    if ($('#sl-plan4').checked) slPlans.push('plan4');
    if ($('#sl-plan5').checked) slPlans.push('plan5');
    if ($('#sl-postgrad').checked) slPlans.push('postgrad');

    // Children / HICBC
    const children = parseInt($('#children').value) || 0;

    // Calculations
    const incomeTax = calculateIncomeTax(salary, pensionEmployee);
    const employeeNI = calculateEmployeeNI(salary);
    const studentLoan = calculateStudentLoan(salary, slPlans);
    const hicbc = calculateChildBenefitCharge(salary, children);

    const totalDeductions = incomeTax + employeeNI + studentLoan + pensionEmployee + hicbc;
    const takeHome = salary - totalDeductions;

    // Show results
    $('#results-section').style.display = 'block';

    // Hero
    setText('res-monthly', formatCurrency(takeHome / 12));
    setText('res-annual', formatCurrency(takeHome));

    // Monthly deductions
    setText('res-gross-m', formatCurrency(salary / 12));
    setText('res-tax-m', `-${formatCurrency(incomeTax / 12)}`);
    setText('res-ni-m', `-${formatCurrency(employeeNI / 12)}`);
    setText('res-pension-m', `-${formatCurrency(pensionEmployee / 12)}`);
    // Update pension label
    const pensionLabel = pension.isTPS ? "Teachers' Pension (TPS)" : "Pension (Employee)";
    $$('.pension-label-dynamic').forEach(el => el.textContent = pensionLabel);

    const slRow = $('#row-sl');
    if (studentLoan > 0) {
        slRow.style.display = 'flex';
        setText('res-sl-m', `-${formatCurrency(studentLoan / 12)}`);
    } else {
        slRow.style.display = 'none';
    }

    const hicbcRow = $('#row-hicbc');
    if (hicbc > 0) {
        hicbcRow.style.display = 'flex';
        setText('res-hicbc-m', `-${formatCurrency(hicbc / 12)}`);
    } else {
        hicbcRow.style.display = 'none';
    }

    setText('res-net-m', formatCurrency(takeHome / 12));

    // Annual summary
    setText('res-gross-a', formatCurrency(salary));
    setText('res-tax-a', `-${formatCurrency(incomeTax)}`);
    setText('res-ni-a', `-${formatCurrency(employeeNI)}`);
    setText('res-pension-a', `-${formatCurrency(pensionEmployee)}`);

    const slRowA = $('#row-sl-a');
    if (studentLoan > 0) {
        slRowA.style.display = 'flex';
        setText('res-sl-a', `-${formatCurrency(studentLoan)}`);
    } else {
        slRowA.style.display = 'none';
    }

    const hicbcRowA = $('#row-hicbc-a');
    if (hicbc > 0) {
        hicbcRowA.style.display = 'flex';
        setText('res-hicbc-a', `-${formatCurrency(hicbc)}`);
    } else {
        hicbcRowA.style.display = 'none';
    }

    setText('res-net-a', formatCurrency(takeHome));

    // Pension summary
    const tpsSummary = $('#tps-summary');
    if (pension.isTPS) {
        tpsSummary.style.display = 'block';
        setText('res-tps-rate', `${(pension.employeeRate * 100).toFixed(1)}%`);
        setText('res-tps-employee', formatCurrency(pensionEmployee));
        setText('res-tps-employer', formatCurrency(pensionEmployer));
        setText('res-tps-total', formatCurrency(pensionEmployee + pensionEmployer));
    } else {
        tpsSummary.style.display = 'none';
    }

    // Rates
    const hourly = takeHome / (37.5 * 52);
    const daily = takeHome / 195;
    const weekly = takeHome / 52;
    setText('res-hourly', formatCurrency(hourly));
    setText('res-daily', formatCurrency(daily));
    setText('res-weekly', formatCurrency(weekly));

    // Marginal rates
    const marginalTax = calculateMarginalRate(salary, []);
    const marginalWithSL = calculateMarginalRate(salary, slPlans);
    const taxPct = Math.round(marginalTax * 100);
    const slPct = Math.round(marginalWithSL * 100);

    setText('res-marginal-pct-tax', `${taxPct}%`);
    const barTax = $('#res-marginal-bar-tax');
    barTax.style.width = `${taxPct}%`;
    barTax.className = 'marginal-rate-fill';
    if (taxPct >= 50) barTax.classList.add('high');
    else if (taxPct >= 35) barTax.classList.add('medium');
    setText('res-marginal-desc-tax', `You keep ${formatCurrency(1 - marginalTax)} per extra £1`);

    setText('res-marginal-pct-sl', `${slPct}%`);
    const barSL = $('#res-marginal-bar-sl');
    barSL.style.width = `${slPct}%`;
    barSL.className = 'marginal-rate-fill';
    if (slPct >= 50) barSL.classList.add('high');
    else if (slPct >= 35) barSL.classList.add('medium');
    setText('res-marginal-desc-sl', `You keep ${formatCurrency(1 - marginalWithSL)} per extra £1`);

    // Scroll
    $('#results-section').scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Generate comparison
    generateComparison(salary, takeHome);
}

// ===== What If? Comparison =====
function quickTakeHome(gross, slPlans, children) {
    const pen = getPensionAmounts(gross);
    const tax = calculateIncomeTax(gross, pen.employee);
    const ni = calculateEmployeeNI(gross);
    const sl = calculateStudentLoan(gross, slPlans);
    const hicbc = calculateChildBenefitCharge(gross, children);
    return gross - tax - ni - sl - pen.employee - hicbc;
}

function generateComparison(currentGross, currentTakeHome) {
    const region = getSelectedRegion();
    const payScales = TEACHER_PAY[region];
    const scaleValue = $('#pay-scale').value;
    const tlrValue = $('#tlr-payment').value;
    const senValue = $('#sen-allowance').value;

    // Get student loan plans
    const slPlans = [];
    if ($('#sl-plan1').checked) slPlans.push('plan1');
    if ($('#sl-plan2').checked) slPlans.push('plan2');
    if ($('#sl-plan4').checked) slPlans.push('plan4');
    if ($('#sl-plan5').checked) slPlans.push('plan5');
    if ($('#sl-postgrad').checked) slPlans.push('postgrad');
    const children = parseInt($('#children').value) || 0;

    const scenarios = [];
    const currentMonthly = currentTakeHome / 12;

    // Current row (highlighted)
    scenarios.push({ label: `📍 Current (${scaleValue}${tlrValue !== 'none' ? ' + TLR' : ''}${senValue !== 'none' ? ' + SEN' : ''})`, gross: currentGross, isCurrent: true });

    // Get base salary (without TLR/SEN)
    let baseSalary = 0;
    if (scaleValue && scaleValue !== 'custom') {
        baseSalary = payScales[scaleValue] || 0;
    } else if (scaleValue === 'custom') {
        baseSalary = parseFloat($('#custom-salary').value) || 0;
    }
    const currentTlr = TLR_PAYMENTS[tlrValue] ? TLR_PAYMENTS[tlrValue].amount : 0;
    const currentSen = SEN_ALLOWANCE[senValue] ? SEN_ALLOWANCE[senValue].amount : 0;

    // Scale progression scenarios
    const allScales = ['M1','M2','M3','M4','M5','M6','UPS1','UPS2','UPS3'];
    const currentIdx = allScales.indexOf(scaleValue);

    if (scaleValue !== 'custom') {
        // Next scale point up
        if (currentIdx >= 0 && currentIdx < allScales.length - 1) {
            const nextScale = allScales[currentIdx + 1];
            const nextBase = payScales[nextScale];
            if (nextBase) {
                scenarios.push({ label: `Move to ${nextScale}`, gross: nextBase + currentTlr + currentSen });
            }
        }

        // If on M scale, show UPS1 jump
        if (scaleValue.startsWith('M') && scaleValue !== 'M6') {
            scenarios.push({ label: 'Jump to UPS1', gross: payScales.UPS1 + currentTlr + currentSen });
        }
        // If on M6, the next is UPS1 — already covered above
        // If on UPS scale, show L1
        if (scaleValue.startsWith('UPS')) {
            scenarios.push({ label: 'Move to Leadership L1', gross: payScales.L1 + currentTlr + currentSen });
        }
    }

    // TLR scenarios (if not already on a TLR)
    if (tlrValue === 'none') {
        scenarios.push({ label: 'Add TLR 2 (Min £3,527)', gross: currentGross + 3527 });
        scenarios.push({ label: 'Add TLR 2 (Max £8,611)', gross: currentGross + 8611 });
        scenarios.push({ label: 'Add TLR 1 (Min £10,174)', gross: currentGross + 10174 });
    } else {
        // Show what it looks like without the TLR
        scenarios.push({ label: 'Without TLR', gross: currentGross - currentTlr });
    }

    // SEN scenarios (if not already on SEN)
    if (senValue === 'none') {
        scenarios.push({ label: 'Add SEN (Min £2,787)', gross: currentGross + 2787 });
        scenarios.push({ label: 'Add SEN (Max £5,497)', gross: currentGross + 5497 });
    } else {
        scenarios.push({ label: 'Without SEN', gross: currentGross - currentSen });
    }

    // Build table rows
    const tbody = $('#comparison-tbody');
    tbody.innerHTML = '';

    for (const s of scenarios) {
        const takeHome = quickTakeHome(s.gross, slPlans, children);
        const monthly = takeHome / 12;
        const diff = monthly - currentMonthly;
        const tr = document.createElement('tr');

        if (s.isCurrent) {
            tr.style.background = 'rgba(99, 102, 241, 0.08)';
            tr.style.fontWeight = '600';
        }

        const diffText = s.isCurrent ? '—' :
            (diff >= 0 ? `+${formatCurrency(diff)}` : `-${formatCurrency(Math.abs(diff))}`);
        const diffColor = s.isCurrent ? 'inherit' : (diff >= 0 ? 'var(--accent-green)' : 'var(--accent-red)');

        tr.innerHTML = `
            <td style="padding:0.5rem;text-align:left;">${s.label}</td>
            <td style="padding:0.5rem;text-align:right;">${formatCurrency(s.gross)}</td>
            <td style="padding:0.5rem;text-align:right;">${formatCurrency(monthly)}</td>
            <td style="padding:0.5rem;text-align:right;color:${diffColor};font-weight:600;">${diffText}</td>
        `;
        tbody.appendChild(tr);
    }

    $('#comparison-section').style.display = 'block';
}

// ===== Share =====
function shareCalculation() {
    const scale = $('#pay-scale').value;
    if (!scale) { alert('Calculate first!'); return; }
    const params = new URLSearchParams();
    params.set('region', getSelectedRegion());
    params.set('scale', scale);
    if (scale === 'custom') params.set('salary', $('#custom-salary').value);
    params.set('tlr', $('#tlr-payment').value);
    params.set('sen', $('#sen-allowance').value);
    if ($('#sl-plan1').checked) params.set('sl1', '1');
    if ($('#sl-plan2').checked) params.set('sl2', '1');
    if ($('#sl-plan4').checked) params.set('sl4', '1');
    if ($('#sl-plan5').checked) params.set('sl5', '1');
    if ($('#sl-postgrad').checked) params.set('slpg', '1');
    const ch = $('#children').value;
    if (ch && ch !== '0') params.set('ch', ch);

    const baseUrl = window.location.href.split('?')[0].split('#')[0];
    const shareUrl = `${baseUrl}?${params.toString()}`;

    if (navigator.share) {
        const monthly = document.getElementById('res-monthly')?.textContent || '';
        navigator.share({
            title: 'Teacher Take-Home Pay Calculator',
            text: `My teacher take-home pay: ${monthly}/month. Check yours here!`,
            url: shareUrl
        }).catch(() => {});
    } else {
        navigator.clipboard.writeText(shareUrl).then(() => {
            const btn = $('#btn-share');
            const original = btn.innerHTML;
            btn.innerHTML = '✅ Link Copied!';
            btn.style.borderColor = 'var(--accent-green)';
            btn.style.color = 'var(--accent-green)';
            setTimeout(() => {
                btn.innerHTML = original;
                btn.style.borderColor = '';
                btn.style.color = '';
            }, 2000);
        });
    }
}

function loadFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('region')) {
        const regionRadio = document.querySelector(`input[name="region"][value="${params.get('region')}"]`);
        if (regionRadio) regionRadio.checked = true;
        populatePayScaleDropdown();
    }
    if (!params.has('scale')) return;
    $('#pay-scale').value = params.get('scale');
    if (params.get('scale') === 'custom' && params.has('salary')) {
        $('#custom-salary-group').style.display = 'block';
        $('#custom-salary').value = params.get('salary');
    }
    if (params.has('tlr')) $('#tlr-payment').value = params.get('tlr');
    if (params.has('sen')) $('#sen-allowance').value = params.get('sen');
    if (params.get('sl1') === '1') $('#sl-plan1').checked = true;
    if (params.get('sl2') === '1') $('#sl-plan2').checked = true;
    if (params.get('sl4') === '1') $('#sl-plan4').checked = true;
    if (params.get('sl5') === '1') $('#sl-plan5').checked = true;
    if (params.get('slpg') === '1') $('#sl-postgrad').checked = true;
    if (params.has('ch')) $('#children').value = params.get('ch');
    setTimeout(() => calculateTeacher(), 100);
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
    initTheme();

    // Sidebar toggle
    const toggle = $('#sidebar-toggle');
    const sidebar = $('#reference-sidebar');
    if (toggle && sidebar) {
        toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
        document.addEventListener('click', (e) => {
            if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && !toggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
    }

    // Pension toggle
    $('#pension-tps').addEventListener('click', () => {
        $('#pension-tps').classList.add('active');
        $('#pension-custom').classList.remove('active');
        $('#custom-pension-inputs').style.display = 'none';
    });
    $('#pension-custom').addEventListener('click', () => {
        $('#pension-custom').classList.add('active');
        $('#pension-tps').classList.remove('active');
        $('#custom-pension-inputs').style.display = 'block';
    });

    populatePayScaleDropdown();

    // Region change
    document.querySelectorAll('input[name="region"]').forEach(radio => {
        radio.addEventListener('change', () => {
            populatePayScaleDropdown();
            updateSalaryFromScale();
        });
    });

    $('#pay-scale').addEventListener('change', updateSalaryFromScale);
    $('#tlr-payment').addEventListener('change', updateSalaryFromScale);
    $('#sen-allowance').addEventListener('change', updateSalaryFromScale);
    $('#custom-salary').addEventListener('input', updateSalaryFromScale);
    $('#btn-calculate').addEventListener('click', calculateTeacher);
    $('#btn-share').addEventListener('click', shareCalculation);
    $('#btn-print').addEventListener('click', () => window.print());

    updateSalaryFromScale();
    loadFromUrl();
});
