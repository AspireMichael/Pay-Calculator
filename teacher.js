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

// ===== Teacher Pay Scales 2025/26 (England excl. London) – 4% uplift =====
const TEACHER_PAY = {
    // Main Pay Range
    M1: 32916, M2: 34823, M3: 37101, M4: 39556, M5: 42057, M6: 45352,
    // Upper Pay Scale
    UPS1: 47472, UPS2: 49232, UPS3: 51048,
    // Leadership
    L1: 51834, L2: 53104, L3: 54403, L4: 55728, L5: 57089,
    L6: 58491, L7: 60038, L8: 61398, L9: 62903, L10: 64490,
    L11: 66135, L12: 67635, L13: 69300, L14: 70998, L15: 72738,
    L16: 74642, L17: 76331, L18: 78223,
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

// ===== Update salary display =====
function updateSalaryFromScale() {
    const scaleValue = $('#pay-scale').value;
    const tlrValue = $('#tlr-payment').value;
    const senValue = $('#sen-allowance').value;

    let baseSalary = 0;
    if (scaleValue && scaleValue !== 'custom') {
        baseSalary = TEACHER_PAY[scaleValue] || 0;
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
}

// ===== Share =====
function shareCalculation() {
    const scale = $('#pay-scale').value;
    if (!scale) { alert('Calculate first!'); return; }
    const params = new URLSearchParams();
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
        navigator.share({
            title: 'Teacher Take-Home Pay Calculator',
            text: `Check out my teacher take-home pay calculation`,
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
