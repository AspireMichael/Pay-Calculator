// ===== UK Tax Rates 2025/26 =====
const TAX = {
    personalAllowance: 12570,
    basicRateLimit: 50270,
    higherRateLimit: 125140,
    basicRate: 0.20,
    higherRate: 0.40,
    additionalRate: 0.45,
    paTaperThreshold: 100000,
};

const EMPLOYEE_NI = {
    primaryThreshold: 12570,
    upperEarningsLimit: 50270,
    basicRate: 0.08,
    higherRate: 0.02,
};

const EMPLOYER_NI = {
    secondaryThreshold: 5000,
    rate: 0.15,
    employmentAllowance: 10500,
};

const STUDENT_LOANS = {
    plan1: { threshold: 24990, rate: 0.09 },
    plan2: { threshold: 27295, rate: 0.09 },
    plan4: { threshold: 27660, rate: 0.09 },
    plan5: { threshold: 25000, rate: 0.09 },
    postgrad: { threshold: 21000, rate: 0.06 },
};

const CHILD_BENEFIT = {
    firstChildWeekly: 26.05,
    additionalChildWeekly: 17.25,
    hicbcLowerThreshold: 60000,
    hicbcUpperThreshold: 80000,
};

const CORPORATION_TAX = {
    smallProfitsLimit: 50000,
    upperLimit: 250000,
    smallRate: 0.19,
    mainRate: 0.25,
    marginalFraction: 3 / 200, // 3/200 for marginal relief
};

const PENSION = {
    lowerQualifyingEarnings: 6240,
    upperQualifyingEarnings: 50270,
    standardEmployeeRate: 0.05,
    standardEmployerRate: 0.03,
};

// ===== Calculation Functions =====

function calculateQualifyingEarnings(grossSalary) {
    if (grossSalary <= PENSION.lowerQualifyingEarnings) return 0;
    return Math.min(grossSalary, PENSION.upperQualifyingEarnings) - PENSION.lowerQualifyingEarnings;
}

function calculatePersonalAllowance(grossSalary) {
    if (grossSalary <= TAX.paTaperThreshold) {
        return TAX.personalAllowance;
    }
    const reduction = Math.floor((grossSalary - TAX.paTaperThreshold) / 2);
    return Math.max(0, TAX.personalAllowance - reduction);
}

function calculateIncomeTax(grossSalary, pensionContribution = 0) {
    // Pension contributions reduce taxable income (relief at source)
    const taxableIncome = Math.max(0, grossSalary - pensionContribution);
    const pa = calculatePersonalAllowance(taxableIncome);
    const taxable = Math.max(0, taxableIncome - pa);

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
        const config = STUDENT_LOANS[plan];
        if (config && grossSalary > config.threshold) {
            total += (grossSalary - config.threshold) * config.rate;
        }
    }
    return Math.round(total * 100) / 100;
}

function calculateChildBenefitCharge(adjustedIncome, numberOfChildren) {
    if (numberOfChildren <= 0 || adjustedIncome <= CHILD_BENEFIT.hicbcLowerThreshold) return 0;

    // Calculate annual child benefit
    let annualBenefit = 0;
    if (numberOfChildren >= 1) {
        annualBenefit += CHILD_BENEFIT.firstChildWeekly * 52;
    }
    if (numberOfChildren >= 2) {
        annualBenefit += CHILD_BENEFIT.additionalChildWeekly * 52 * (numberOfChildren - 1);
    }

    if (adjustedIncome >= CHILD_BENEFIT.hicbcUpperThreshold) {
        return Math.round(annualBenefit * 100) / 100; // 100% clawback
    }

    // 1% per £200 over the lower threshold
    const excess = adjustedIncome - CHILD_BENEFIT.hicbcLowerThreshold;
    const percentage = Math.min(100, Math.floor(excess / 200));
    const charge = annualBenefit * (percentage / 100);

    return Math.round(charge * 100) / 100;
}

function calculateEmployerNI(grossSalary, useAllowance = false) {
    if (grossSalary <= EMPLOYER_NI.secondaryThreshold) return 0;

    let ni = (grossSalary - EMPLOYER_NI.secondaryThreshold) * EMPLOYER_NI.rate;

    if (useAllowance) {
        ni = Math.max(0, ni - EMPLOYER_NI.employmentAllowance);
    }

    return Math.round(ni * 100) / 100;
}

function calculateCorporationTax(profit) {
    if (profit <= 0) return 0;
    if (profit <= CORPORATION_TAX.smallProfitsLimit) {
        return Math.round(profit * CORPORATION_TAX.smallRate * 100) / 100;
    }
    if (profit >= CORPORATION_TAX.upperLimit) {
        return Math.round(profit * CORPORATION_TAX.mainRate * 100) / 100;
    }

    // Marginal relief
    const mainTax = profit * CORPORATION_TAX.mainRate;
    const relief = (CORPORATION_TAX.upperLimit - profit) * CORPORATION_TAX.marginalFraction;
    return Math.round((mainTax - relief) * 100) / 100;
}

function formatCurrency(amount) {
    const abs = Math.abs(amount);
    const formatted = abs.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (amount < 0) return `-£${formatted}`;
    return `£${formatted}`;
}

function formatCurrencyShort(amount) {
    const abs = Math.abs(amount);
    if (abs >= 1000000) {
        return `£${(amount / 1000000).toFixed(1)}m`;
    }
    if (abs >= 1000) {
        return `£${(amount / 1000).toFixed(0)}k`;
    }
    return formatCurrency(amount);
}

// ===== DOM Helpers =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
};

// ===== Tab Switching =====
function initTabs() {
    $$('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;

            $$('.tab-btn').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');

            $$('.tab-panel').forEach(p => p.classList.remove('active'));
            $(`#panel-${targetTab}`).classList.add('active');
        });
    });
}

// ===== Theme Toggle =====
function initTheme() {
    const toggle = $('#themeToggle');
    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);

    toggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    });
}

// ===== Pension Toggle =====
function initPensionToggle() {
    // Employee tab pension toggle
    $('#pension-standard').addEventListener('click', () => {
        $('#pension-standard').classList.add('active');
        $('#pension-custom').classList.remove('active');
        $('#pension-standard-info').classList.remove('hidden');
        $('#pension-custom-info').classList.add('hidden');
    });

    $('#pension-custom').addEventListener('click', () => {
        $('#pension-custom').classList.add('active');
        $('#pension-standard').classList.remove('active');
        $('#pension-custom-info').classList.remove('hidden');
        $('#pension-standard-info').classList.add('hidden');
    });

    // Employer tab pension toggle
    $('#er-pension-standard').addEventListener('click', () => {
        $('#er-pension-standard').classList.add('active');
        $('#er-pension-custom').classList.remove('active');
        $('#er-pension-custom-info').classList.add('hidden');
    });

    $('#er-pension-custom').addEventListener('click', () => {
        $('#er-pension-custom').classList.add('active');
        $('#er-pension-standard').classList.remove('active');
        $('#er-pension-custom-info').classList.remove('hidden');
    });
}

// ===== Sidebar Toggle (Mobile) =====
function initSidebar() {
    const toggle = $('#sidebar-toggle');
    const sidebar = $('#reference-sidebar');

    toggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('open') &&
            !sidebar.contains(e.target) &&
            !toggle.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });
}

// ===== Mode Switcher =====
function initMode() {
    const savedMode = localStorage.getItem('uk-calc-mode') || 'personal';
    setMode(savedMode);

    $$('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setMode(btn.dataset.mode);
        });
    });
}

function setMode(mode) {
    $$('.mode-btn').forEach(b => b.classList.remove('active'));
    $(`[data-mode="${mode}"]`).classList.add('active');

    if (mode === 'personal') {
        document.body.classList.add('personal-mode');
        // If currently on a business tab, switch to employee
        const activeTab = $('.tab-btn.active');
        if (activeTab && activeTab.classList.contains('business-only')) {
            $('#tab-employee').click();
        }
    } else {
        document.body.classList.remove('personal-mode');
    }

    localStorage.setItem('uk-calc-mode', mode);
}

// ===== Marginal Rate Calculator =====
function calculateMarginalRate(salary, slPlans) {
    // Calculate marginal rates: income tax + NI + student loan (excludes pension - not a tax)
    let marginalIncomeTax = 0;
    let marginalNI = 0;
    let marginalSL = 0;

    // Personal allowance
    let pa = TAX.personalAllowance;
    if (salary > TAX.paThreshold) {
        pa = Math.max(0, TAX.personalAllowance - (salary - TAX.paThreshold) / 2);
    }

    const taxable = Math.max(0, salary - pa);
    const basicBand = Math.max(0, TAX.basicRateLimit - pa);

    // Income tax marginal rate
    if (salary > TAX.paThreshold && pa > 0) {
        // In PA taper zone: effective 60% rate (20% basic + 40% from losing PA)
        marginalIncomeTax = 0.60;
    } else if (taxable <= basicBand) {
        marginalIncomeTax = salary > pa ? TAX.basicRate : 0;
    } else if (taxable <= basicBand + (TAX.higherRateLimit - TAX.basicRateLimit)) {
        marginalIncomeTax = TAX.higherRate;
    } else {
        marginalIncomeTax = TAX.additionalRate;
    }

    // NI marginal rate
    if (salary > EMPLOYEE_NI.primaryThreshold && salary <= EMPLOYEE_NI.upperEarningsLimit) {
        marginalNI = EMPLOYEE_NI.basicRate;
    } else if (salary > EMPLOYEE_NI.upperEarningsLimit) {
        marginalNI = EMPLOYEE_NI.higherRate;
    }

    // Student loan marginal rates
    for (const plan of slPlans) {
        const sl = STUDENT_LOANS[plan];
        if (sl && salary > sl.threshold) {
            marginalSL += sl.rate;
        }
    }

    const totalMarginal = marginalIncomeTax + marginalNI + marginalSL;
    return Math.min(totalMarginal, 1); // Cap at 100%
}

// ===== Employee Calculator =====
function getAnnualSalary() {
    const raw = parseFloat($('#emp-salary').value) || 0;
    const isMonthly = $('#salary-monthly').classList.contains('active');
    const annual = isMonthly ? raw * 12 : raw;

    // Show conversion badge
    const badge = $('#salary-conversion');
    if (isMonthly && raw > 0) {
        badge.textContent = `= ${formatCurrency(annual)} per year`;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }

    return annual;
}

function calculateEmployee() {
    const salary = getAnnualSalary();
    if (salary <= 0) return;

    // Pension
    const isStandard = $('#pension-standard').classList.contains('active');
    let pensionEmployee, pensionEmployer;

    if (isStandard) {
        // Standard workplace: contributions on qualifying earnings only (£6,240–£50,270)
        const qualifyingEarnings = calculateQualifyingEarnings(salary);
        pensionEmployee = qualifyingEarnings * PENSION.standardEmployeeRate;
        pensionEmployer = qualifyingEarnings * PENSION.standardEmployerRate;
    } else {
        // Custom: percentage of full gross salary
        const empPensionPct = parseFloat($('#emp-pension-employee').value) || 0;
        const erPensionPct = parseFloat($('#emp-pension-employer').value) || 0;
        pensionEmployee = salary * (empPensionPct / 100);
        pensionEmployer = salary * (erPensionPct / 100);
    }

    // Student loans
    const slPlans = [];
    if ($('#emp-sl-plan1').checked) slPlans.push('plan1');
    if ($('#emp-sl-plan2').checked) slPlans.push('plan2');
    if ($('#emp-sl-plan4').checked) slPlans.push('plan4');
    if ($('#emp-sl-plan5').checked) slPlans.push('plan5');
    if ($('#emp-sl-postgrad').checked) slPlans.push('postgrad');

    // Children / HICBC
    const children = parseInt($('#emp-children').value) || 0;

    // Calculations
    const incomeTax = calculateIncomeTax(salary, pensionEmployee);
    const employeeNI = calculateEmployeeNI(salary);
    const studentLoan = calculateStudentLoan(salary, slPlans);
    const hicbc = calculateChildBenefitCharge(salary, children);

    const totalDeductions = incomeTax + employeeNI + studentLoan + pensionEmployee + hicbc;
    const takeHome = salary - totalDeductions;

    // Show results
    $('#employee-results').style.display = 'block';

    // Monthly
    setText('res-monthly-takehome', formatCurrency(takeHome / 12));
    setText('res-annual-takehome', formatCurrency(takeHome));
    setText('res-gross-monthly', formatCurrency(salary / 12));
    setText('res-tax-monthly', `-${formatCurrency(incomeTax / 12)}`);
    setText('res-ni-monthly', `-${formatCurrency(employeeNI / 12)}`);
    setText('res-pension-employee-monthly', `-${formatCurrency(pensionEmployee / 12)}`);
    setText('res-net-monthly', formatCurrency(takeHome / 12));

    // Student Loan row
    const slRow = $('#row-sl');
    if (studentLoan > 0) {
        slRow.style.display = 'flex';
        setText('res-sl-monthly', `-${formatCurrency(studentLoan / 12)}`);
    } else {
        slRow.style.display = 'none';
    }

    // HICBC row
    const hicbcRow = $('#row-hicbc');
    if (hicbc > 0) {
        hicbcRow.style.display = 'flex';
        setText('res-hicbc-monthly', `-${formatCurrency(hicbc / 12)}`);
    } else {
        hicbcRow.style.display = 'none';
    }

    // Annual
    setText('res-gross-annual', formatCurrency(salary));
    setText('res-tax-annual', `-${formatCurrency(incomeTax)}`);
    setText('res-ni-annual', `-${formatCurrency(employeeNI)}`);
    setText('res-pension-employee-annual', `-${formatCurrency(pensionEmployee)}`);
    setText('res-net-annual', formatCurrency(takeHome));

    const slRowAnnual = $('#row-sl-annual');
    if (studentLoan > 0) {
        slRowAnnual.style.display = 'flex';
        setText('res-sl-annual', `-${formatCurrency(studentLoan)}`);
    } else {
        slRowAnnual.style.display = 'none';
    }

    const hicbcRowAnnual = $('#row-hicbc-annual');
    if (hicbc > 0) {
        hicbcRowAnnual.style.display = 'flex';
        setText('res-hicbc-annual', `-${formatCurrency(hicbc)}`);
    } else {
        hicbcRowAnnual.style.display = 'none';
    }

    // Pension summary
    setText('res-pension-you-annual', formatCurrency(pensionEmployee));
    setText('res-pension-employer-annual', formatCurrency(pensionEmployer));
    setText('res-pension-total-annual', formatCurrency(pensionEmployee + pensionEmployer));

    // Hourly / Daily / Weekly rates (37.5 hrs/week, 260 working days/year, 52 weeks)
    const hourlyRate = takeHome / (37.5 * 52);
    const dailyRate = takeHome / 260;
    const weeklyRate = takeHome / 52;
    setText('res-hourly-rate', formatCurrency(hourlyRate));
    setText('res-daily-rate', formatCurrency(dailyRate));
    setText('res-weekly-rate', formatCurrency(weeklyRate));

    // Marginal rates — two versions
    const marginalTaxOnly = calculateMarginalRate(salary, []);
    const marginalWithSL = calculateMarginalRate(salary, slPlans);
    const taxPct = Math.round(marginalTaxOnly * 100);
    const slPct = Math.round(marginalWithSL * 100);

    // Tax + NI box
    setText('res-marginal-pct-tax', `${taxPct}%`);
    const barTax = $('#res-marginal-bar-tax');
    barTax.style.width = `${taxPct}%`;
    barTax.className = 'marginal-rate-fill';
    if (taxPct >= 50) barTax.classList.add('high');
    else if (taxPct >= 35) barTax.classList.add('medium');
    setText('res-marginal-desc-tax', `You keep ${formatCurrency(1 - marginalTaxOnly)} per extra £1`);

    // Incl. Student Loan box
    setText('res-marginal-pct-sl', `${slPct}%`);
    const barSL = $('#res-marginal-bar-sl');
    barSL.style.width = `${slPct}%`;
    barSL.className = 'marginal-rate-fill';
    if (slPct >= 50) barSL.classList.add('high');
    else if (slPct >= 35) barSL.classList.add('medium');
    setText('res-marginal-desc-sl', `You keep ${formatCurrency(1 - marginalWithSL)} per extra £1`);

    // Monthly Payroll Cost (employer view)
    const employerNI = calculateEmployerNI(salary, false); // no allowance in personal view
    const monthlyGross = salary / 12;
    const monthlyErNI = employerNI / 12;
    const monthlyErPension = pensionEmployer / 12;
    const monthlyTotalCost = monthlyGross + monthlyErNI + monthlyErPension;

    setText('res-payroll-gross', formatCurrency(monthlyGross));
    setText('res-payroll-erni', formatCurrency(monthlyErNI));
    setText('res-payroll-erpension', formatCurrency(monthlyErPension));
    setText('res-payroll-total', formatCurrency(monthlyTotalCost));
    setText('res-payroll-total-annual', formatCurrency(monthlyTotalCost * 12));

    // Scroll to results
    $('#employee-results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== Employer Cost Calculator =====
let additionalCosts = [];

function getAnnualErSalary() {
    const raw = parseFloat($('#er-salary').value) || 0;
    const isMonthly = $('#er-salary-monthly').classList.contains('active');
    const annual = isMonthly ? raw * 12 : raw;

    const badge = $('#er-salary-conversion');
    if (isMonthly && raw > 0) {
        badge.textContent = `= ${formatCurrency(annual)} per year`;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }

    return annual;
}

function calculateEmployer() {
    const salary = getAnnualErSalary();
    if (salary <= 0) return;

    const isStandard = $('#er-pension-standard').classList.contains('active');
    const useAllowance = $('#er-employment-allowance').checked;

    let erPension;
    if (isStandard) {
        const qualifyingEarnings = calculateQualifyingEarnings(salary);
        erPension = qualifyingEarnings * PENSION.standardEmployerRate;
    } else {
        const pensionPct = parseFloat($('#er-pension-pct').value) || 0;
        erPension = salary * (pensionPct / 100);
    }
    const erNI = calculateEmployerNI(salary, useAllowance);
    const allowanceSaving = useAllowance ? Math.min(
        (salary - EMPLOYER_NI.secondaryThreshold) * EMPLOYER_NI.rate,
        EMPLOYER_NI.employmentAllowance
    ) : 0;

    const baseCost = salary + erNI + erPension;

    // Additional costs total (annual)
    const additionalTotal = additionalCosts.reduce((sum, c) => sum + c.monthly * 12, 0);
    const grandTotal = baseCost + additionalTotal;

    // Show results
    $('#employer-results').style.display = 'block';

    setText('er-res-monthly-total', formatCurrency(grandTotal / 12));
    setText('er-res-annual-total', formatCurrency(grandTotal));
    setText('er-res-salary', formatCurrency(salary));
    setText('er-res-erni', formatCurrency(erNI));
    setText('er-res-pension', formatCurrency(erPension));

    if (useAllowance && allowanceSaving > 0) {
        $('#er-row-allowance').style.display = 'flex';
        setText('er-res-allowance', `-${formatCurrency(allowanceSaving)}`);
    } else {
        $('#er-row-allowance').style.display = 'none';
    }

    setText('er-res-base-total', formatCurrency(baseCost));
    setText('er-res-grand-total', formatCurrency(grandTotal));
    setText('er-res-grand-total-monthly', formatCurrency(grandTotal / 12));
}

function renderAdditionalCosts() {
    const container = $('#additional-costs-list');
    container.innerHTML = '';

    additionalCosts.forEach((cost, index) => {
        const item = document.createElement('div');
        item.className = 'cost-item';
        item.innerHTML = `
            <div class="cost-item-info">
                <span class="cost-item-name">${escapeHtml(cost.name)}</span>
                <span class="cost-item-amount">${formatCurrency(cost.monthly)}/mo (${formatCurrency(cost.monthly * 12)}/yr)</span>
            </div>
            <button class="btn-remove" data-index="${index}" title="Remove">×</button>
        `;
        container.appendChild(item);
    });

    // Re-bind remove buttons
    container.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.index);
            additionalCosts.splice(idx, 1);
            renderAdditionalCosts();
            saveState();
            // Recalculate if results visible
            if ($('#employer-results').style.display !== 'none') {
                calculateEmployer();
            }
        });
    });
}

function addAdditionalCost() {
    const name = $('#add-cost-name').value.trim();
    const amount = parseFloat($('#add-cost-amount').value) || 0;

    if (!name || amount <= 0) return;

    additionalCosts.push({ name, monthly: amount });
    renderAdditionalCosts();

    // Clear inputs
    $('#add-cost-name').value = '';
    $('#add-cost-amount').value = '';

    // Recalculate if results visible
    if ($('#employer-results').style.display !== 'none') {
        calculateEmployer();
    }
}

// ===== Hiring Calculator =====
let currentEmployees = [];

function addEmployeeRow() {
    const id = Date.now();
    currentEmployees.push({ id, name: '', salary: 0 });
    renderEmployees();
}

function renderEmployees() {
    const container = $('#current-employees-list');

    if (currentEmployees.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No employees added yet. Add employees or just use the total payroll figure above.</p></div>';
        return;
    }

    container.innerHTML = '';
    currentEmployees.forEach((emp, index) => {
        const row = document.createElement('div');
        row.className = 'employee-row';
        row.innerHTML = `
            <input type="text" placeholder="Employee name" value="${escapeHtml(emp.name)}" 
                   class="input-standard" data-index="${index}" data-field="name">
            <div class="input-wrapper currency">
                <span class="input-prefix">£</span>
                <input type="number" placeholder="Salary" value="${emp.salary || ''}" 
                       min="0" step="100" data-index="${index}" data-field="salary">
            </div>
            <button class="btn-remove" data-index="${index}" title="Remove">×</button>
        `;
        container.appendChild(row);
    });

    // Bind events
    container.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', (e) => {
            const idx = parseInt(e.target.dataset.index);
            const field = e.target.dataset.field;
            if (field === 'name') {
                currentEmployees[idx].name = e.target.value;
            } else if (field === 'salary') {
                currentEmployees[idx].salary = parseFloat(e.target.value) || 0;
            }
        });
    });

    container.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.index);
            currentEmployees.splice(idx, 1);
            renderEmployees();
            saveState();
        });
    });
}

function calculatePayrollSummary() {
    const revenue = parseFloat($('#hire-revenue').value) || 0;
    const profit = parseFloat($('#hire-profit').value) || 0;
    let currentPayroll = parseFloat($('#hire-current-payroll').value) || 0;
    const useEA = $('#hire-employment-allowance').checked;

    // Sum employee salaries if provided
    const employeeSalaryTotal = currentEmployees.reduce((sum, e) => sum + (e.salary || 0), 0);
    if (employeeSalaryTotal > 0) {
        currentPayroll = employeeSalaryTotal;
        $('#hire-current-payroll').value = currentPayroll;
    }

    if (currentPayroll <= 0 && currentEmployees.length === 0) return;

    let totalSalaries = 0;
    let totalErNI = 0;
    let totalErPension = 0;
    let employeeBreakdown = [];

    if (currentEmployees.length > 0) {
        // Calculate per-employee
        for (const emp of currentEmployees) {
            const sal = emp.salary || 0;
            const erNI = calculateEmployerNI(sal, false);
            const qe = calculateQualifyingEarnings(sal);
            const erPension = qe * PENSION.standardEmployerRate;
            const total = sal + erNI + erPension;

            totalSalaries += sal;
            totalErNI += erNI;
            totalErPension += erPension;

            employeeBreakdown.push({
                name: emp.name || 'Unnamed',
                salary: sal,
                erNI,
                erPension,
                total
            });
        }
    } else {
        // Use flat payroll figure — estimate NI and pension across the total
        totalSalaries = currentPayroll;
        totalErNI = calculateEmployerNI(currentPayroll, false);
        const qe = calculateQualifyingEarnings(currentPayroll);
        totalErPension = qe * PENSION.standardEmployerRate;
    }

    // Apply Employment Allowance against total Employer NI
    // EA only available with 2+ people on payroll (sole director can't claim)
    const headcount = currentEmployees.length > 0 ? currentEmployees.length : (currentPayroll > 0 ? 1 : 0);
    let eaSaving = 0;
    if (useEA && headcount >= 2) {
        eaSaving = Math.min(totalErNI, EMPLOYER_NI.employmentAllowance);
        totalErNI = Math.max(0, totalErNI - EMPLOYER_NI.employmentAllowance);
    }

    const totalCost = totalSalaries + totalErNI + totalErPension;

    // Corporation tax
    const ct = calculateCorporationTax(profit);
    const profitAfterTax = profit - ct;
    const margin = revenue > 0 ? (profitAfterTax / revenue * 100) : 0;
    const costPerRevenue = revenue > 0 ? (totalCost / revenue) : 0;

    // Show results
    $('#payroll-summary-results').style.display = 'block';

    setText('ps-total-salaries', formatCurrency(totalSalaries));
    setText('ps-total-erni', formatCurrency(totalErNI) + (eaSaving > 0 ? ` (saved ${formatCurrency(eaSaving)} via EA)` : ''));
    setText('ps-total-pension', formatCurrency(totalErPension));
    setText('ps-total-cost', formatCurrency(totalCost));

    setText('ps-revenue', formatCurrency(revenue));
    setText('ps-emp-cost', formatCurrency(totalCost));
    setText('ps-profit', formatCurrency(profit));
    setText('ps-corp-tax', formatCurrency(ct));
    setText('ps-profit-after-tax', formatCurrency(profitAfterTax));
    setText('ps-margin', `${margin.toFixed(1)}%`);
    setText('ps-cost-per-revenue', `${formatCurrency(costPerRevenue * 100).replace('£', '')}p per £1`);

    // Per-employee breakdown table
    if (employeeBreakdown.length > 0) {
        $('#ps-employee-breakdown').style.display = 'block';
        const tbody = $('#ps-employee-table-body');
        tbody.innerHTML = '';

        for (const emp of employeeBreakdown) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${escapeHtml(emp.name)}</td>
                <td>${formatCurrency(emp.salary)}</td>
                <td>${formatCurrency(emp.erNI)}</td>
                <td>${formatCurrency(emp.erPension)}</td>
                <td><strong>${formatCurrency(emp.total)}</strong></td>
            `;
            tbody.appendChild(row);
        }

        // Totals row
        const totalsRow = document.createElement('tr');
        totalsRow.className = 'total-row';
        let erNITotalLabel = formatCurrency(totalErNI);
        if (eaSaving > 0) erNITotalLabel += ` *`;
        totalsRow.innerHTML = `
            <td><strong>Total</strong></td>
            <td><strong>${formatCurrency(totalSalaries)}</strong></td>
            <td><strong>${erNITotalLabel}</strong></td>
            <td><strong>${formatCurrency(totalErPension)}</strong></td>
            <td><strong>${formatCurrency(totalCost)}</strong></td>
        `;
        tbody.appendChild(totalsRow);

        if (eaSaving > 0) {
            const eaRow = document.createElement('tr');
            eaRow.innerHTML = `
                <td colspan="5" style="font-size:0.82rem;color:var(--accent-green);padding-top:0.25rem;">
                    * Employment Allowance saves ${formatCurrency(eaSaving)} off Employer NI (${formatCurrency(EMPLOYER_NI.employmentAllowance)} allowance)
                </td>
            `;
            tbody.appendChild(eaRow);
        }
    } else {
        $('#ps-employee-breakdown').style.display = 'none';
    }

    // Scroll to results
    $('#payroll-summary-results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function calculateHiring() {
    const revenue = parseFloat($('#hire-revenue').value) || 0;
    const profit = parseFloat($('#hire-profit').value) || 0;
    let currentPayroll = parseFloat($('#hire-current-payroll').value) || 0;
    const useEA = $('#hire-employment-allowance').checked;

    // Sum employee salaries if provided
    const employeeSalaryTotal = currentEmployees.reduce((sum, e) => sum + (e.salary || 0), 0);
    if (employeeSalaryTotal > 0) {
        currentPayroll = employeeSalaryTotal;
        $('#hire-current-payroll').value = currentPayroll;
    }

    const newSalary = parseFloat($('#hire-new-salary').value) || 0;
    const newPensionPct = parseFloat($('#hire-new-pension').value) || 3;
    const newExtrasMonthly = parseFloat($('#hire-new-extras').value) || 0;

    // If no new hire salary, just show payroll summary
    if (newSalary <= 0) {
        calculatePayrollSummary();
        return;
    }

    // Calculate existing workforce Employer NI (before new hire)
    let existingErNI = 0;
    const existingHeadcount = currentEmployees.length > 0 ? currentEmployees.length : (currentPayroll > 0 ? 1 : 0);
    if (currentEmployees.length > 0) {
        for (const emp of currentEmployees) {
            existingErNI += calculateEmployerNI(emp.salary || 0, false);
        }
    } else if (currentPayroll > 0) {
        existingErNI = calculateEmployerNI(currentPayroll, false);
    }

    // New hire raw Employer NI
    const newHireErNI = calculateEmployerNI(newSalary, false);
    const totalErNI_before = existingErNI;
    const totalErNI_after = existingErNI + newHireErNI;
    const afterHeadcount = existingHeadcount + 1;

    // Apply Employment Allowance:
    // EA only available with 2+ people on payroll (sole director can't claim)
    // BEFORE: only apply EA if existing headcount >= 2
    // AFTER:  apply EA if total headcount >= 2 (hiring makes you eligible)
    let effectiveErNI_before = totalErNI_before;
    let effectiveErNI_after = totalErNI_after;
    let eaSavingBefore = 0;
    let eaSavingAfter = 0;
    if (useEA) {
        // Before hire: only eligible if already have 2+ people
        if (existingHeadcount >= 2) {
            eaSavingBefore = Math.min(totalErNI_before, EMPLOYER_NI.employmentAllowance);
            effectiveErNI_before = Math.max(0, totalErNI_before - EMPLOYER_NI.employmentAllowance);
        }
        // After hire: eligible if 2+ people total
        if (afterHeadcount >= 2) {
            eaSavingAfter = Math.min(totalErNI_after, EMPLOYER_NI.employmentAllowance);
            effectiveErNI_after = Math.max(0, totalErNI_after - EMPLOYER_NI.employmentAllowance);
        }
    }

    // The actual extra NI cost = difference in effective NI bills
    // Can be NEGATIVE when hiring triggers EA eligibility
    const effectiveNewErNI = effectiveErNI_after - effectiveErNI_before;

    const newPension = newSalary * (newPensionPct / 100);
    const newExtrasAnnual = newExtrasMonthly * 12;
    const trueCostOfHire = newSalary + effectiveNewErNI + newPension + newExtrasAnnual;

    // Corporation tax: before
    const ctBefore = calculateCorporationTax(profit);
    const profitAfterTaxBefore = profit - ctBefore;

    // Corporation tax: after (employment costs reduce profit)
    const newProfit = profit - trueCostOfHire;
    const ctAfter = calculateCorporationTax(newProfit);
    const profitAfterTaxAfter = newProfit - ctAfter;

    // CT saving
    const ctSaving = ctBefore - ctAfter;
    const netCost = trueCostOfHire - ctSaving;

    // Margins
    const marginBefore = revenue > 0 ? (profitAfterTaxBefore / revenue * 100) : 0;
    const marginAfter = revenue > 0 ? (profitAfterTaxAfter / revenue * 100) : 0;

    // Show results
    $('#hiring-results').style.display = 'block';

    // Impact cards
    setText('hire-res-true-cost', formatCurrency(trueCostOfHire));
    setText('hire-res-tax-saving', formatCurrency(ctSaving));
    setText('hire-res-net-cost', formatCurrency(netCost));
    setText('hire-res-monthly-impact', formatCurrency(netCost / 12));

    // Comparison table
    setText('hire-cmp-revenue-before', formatCurrency(revenue));
    setText('hire-cmp-revenue-after', formatCurrency(revenue));
    setText('hire-cmp-revenue-change', '–');

    setText('hire-cmp-payroll-before', formatCurrency(currentPayroll));
    setText('hire-cmp-payroll-after', formatCurrency(currentPayroll + newSalary));
    setText('hire-cmp-payroll-change', `+${formatCurrency(newSalary)}`);

    // NI row — show effective totals
    setText('hire-cmp-erni-before', formatCurrency(effectiveErNI_before));
    setText('hire-cmp-erni-after', formatCurrency(effectiveErNI_after));
    const niDiff = effectiveErNI_after - effectiveErNI_before;
    const niChangeEl = $('#hire-cmp-erni-change');
    if (niDiff < 0) {
        niChangeEl.innerHTML = `<span style="color:var(--accent-green);">${formatCurrency(niDiff)}</span>`;
    } else {
        niChangeEl.textContent = `+${formatCurrency(niDiff)}`;
    }

    // EA note
    const eaRow = $('#hire-row-ea');
    if (useEA) {
        eaRow.style.display = '';
        let note = '';
        if (existingHeadcount < 2 && afterHeadcount >= 2) {
            note = `✓ Hiring unlocks Employment Allowance (${formatCurrency(EMPLOYER_NI.employmentAllowance)}) — saves ${formatCurrency(eaSavingAfter)} off total Employer NI`;
        } else if (eaSavingAfter > 0) {
            note = `✓ Employment Allowance saves ${formatCurrency(eaSavingAfter)} off total Employer NI`;
        }
        $('#hire-ea-note').textContent = note;
    } else {
        eaRow.style.display = 'none';
    }

    setText('hire-cmp-pension', formatCurrency(newPension));
    setText('hire-cmp-pension-change', `+${formatCurrency(newPension)}`);

    setText('hire-cmp-profit-before', formatCurrency(profit));
    setText('hire-cmp-profit-after', formatCurrency(newProfit));
    setText('hire-cmp-profit-change', formatCurrency(newProfit - profit));

    setText('hire-cmp-ct-before', formatCurrency(ctBefore));
    setText('hire-cmp-ct-after', formatCurrency(ctAfter));
    setText('hire-cmp-ct-change', formatCurrency(ctAfter - ctBefore));

    setText('hire-cmp-pat-before', formatCurrency(profitAfterTaxBefore));
    setText('hire-cmp-pat-after', formatCurrency(profitAfterTaxAfter));
    setText('hire-cmp-pat-change', formatCurrency(profitAfterTaxAfter - profitAfterTaxBefore));

    setText('hire-cmp-margin-before', `${marginBefore.toFixed(1)}%`);
    setText('hire-cmp-margin-after', `${marginAfter.toFixed(1)}%`);
    setText('hire-cmp-margin-change', `${(marginAfter - marginBefore).toFixed(1)}%`);

    // Color coding for change column
    const patChange = $('#hire-cmp-pat-change');
    if (profitAfterTaxAfter < profitAfterTaxBefore) {
        patChange.classList.add('negative-text');
        patChange.classList.remove('positive-text');
    } else {
        patChange.classList.add('positive-text');
        patChange.classList.remove('negative-text');
    }

    // Scroll to results
    $('#hiring-results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== Pay Rise Calculator =====
let prEmployees = [];

function addPrEmployeeRow() {
    const id = Date.now();
    prEmployees.push({ id, name: '', currentSalary: 0, newSalary: 0, raisePct: 0 });
    renderPrEmployees();
}

function renderPrEmployees() {
    const container = $('#pr-employees-list');

    if (prEmployees.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Add employees to model pay rises. Enter their current salary and the proposed new salary or raise %.</p></div>';
        return;
    }

    container.innerHTML = '';

    // Header row
    const header = document.createElement('div');
    header.className = 'pr-employee-header';
    header.innerHTML = `
        <span style="flex:1.2;">Name</span>
        <span style="flex:1;">Current Salary</span>
        <span style="flex:0.6;">Raise %</span>
        <span style="flex:1;">New Salary</span>
        <span style="width:36px;"></span>
    `;
    header.style.cssText = 'display:flex;gap:0.5rem;padding:0.25rem 0;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;opacity:0.6;font-weight:600;';
    container.appendChild(header);

    prEmployees.forEach((emp, index) => {
        const row = document.createElement('div');
        row.className = 'employee-row';
        row.innerHTML = `
            <input type="text" placeholder="Employee name" value="${escapeHtml(emp.name)}"
                   class="input-standard" data-index="${index}" data-field="name" style="flex:1.2;">
            <div class="input-wrapper currency" style="flex:1;">
                <span class="input-prefix">£</span>
                <input type="number" placeholder="Current" value="${emp.currentSalary || ''}"
                       min="0" step="100" data-index="${index}" data-field="currentSalary">
            </div>
            <div class="input-wrapper percent" style="flex:0.6;">
                <input type="number" placeholder="%" value="${emp.raisePct || ''}"
                       min="0" max="100" step="0.5" data-index="${index}" data-field="raisePct">
                <span class="input-suffix">%</span>
            </div>
            <div class="input-wrapper currency" style="flex:1;">
                <span class="input-prefix">£</span>
                <input type="number" placeholder="New salary" value="${emp.newSalary || ''}"
                       min="0" step="100" data-index="${index}" data-field="newSalary">
            </div>
            <button class="btn-remove" data-index="${index}" title="Remove">×</button>
        `;
        container.appendChild(row);
    });

    // Bind events
    container.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', (e) => {
            const idx = parseInt(e.target.dataset.index);
            const field = e.target.dataset.field;
            const val = e.target.value;

            if (field === 'name') {
                prEmployees[idx].name = val;
            } else if (field === 'currentSalary') {
                prEmployees[idx].currentSalary = parseFloat(val) || 0;
                // Auto-calc new salary from raise %
                if (prEmployees[idx].raisePct > 0) {
                    prEmployees[idx].newSalary = Math.round(prEmployees[idx].currentSalary * (1 + prEmployees[idx].raisePct / 100));
                    renderPrEmployees();
                }
            } else if (field === 'raisePct') {
                prEmployees[idx].raisePct = parseFloat(val) || 0;
                // Auto-calc new salary from current + pct
                if (prEmployees[idx].currentSalary > 0) {
                    prEmployees[idx].newSalary = Math.round(prEmployees[idx].currentSalary * (1 + prEmployees[idx].raisePct / 100));
                    renderPrEmployees();
                }
            } else if (field === 'newSalary') {
                prEmployees[idx].newSalary = parseFloat(val) || 0;
                // Auto-calc raise % from current and new
                if (prEmployees[idx].currentSalary > 0) {
                    prEmployees[idx].raisePct = Math.round(((prEmployees[idx].newSalary / prEmployees[idx].currentSalary) - 1) * 10000) / 100;
                    renderPrEmployees();
                }
            }
        });
    });

    container.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.index);
            prEmployees.splice(idx, 1);
            renderPrEmployees();
            saveState();
        });
    });
}

function applyWorkforceRaise() {
    const pct = parseFloat($('#pr-workforce-pct').value) || 0;
    if (pct <= 0 || prEmployees.length === 0) return;

    for (const emp of prEmployees) {
        emp.raisePct = pct;
        if (emp.currentSalary > 0) {
            emp.newSalary = Math.round(emp.currentSalary * (1 + pct / 100));
        }
    }
    renderPrEmployees();
}

function copyFromHiring() {
    if (currentEmployees.length === 0) {
        alert('No employees found in the Hiring Calculator. Add employees there first.');
        return;
    }

    // Copy hiring employees into pay rise list
    prEmployees = currentEmployees.map(emp => ({
        id: Date.now() + Math.random(),
        name: emp.name || '',
        currentSalary: emp.salary || 0,
        newSalary: emp.salary || 0,
        raisePct: 0,
    }));

    renderPrEmployees();
    saveState();
}

function calculatePayRise() {
    if (prEmployees.length === 0) return;

    let totalSalaryIncrease = 0;
    let totalNIIncrease = 0;
    let totalPensionIncrease = 0;
    let rows = [];

    // Helper: calculate employee take-home (no student loan, standard 5% auto-enrolment pension)
    function estimateTakeHome(salary) {
        const qe = calculateQualifyingEarnings(salary);
        const pensionEmp = qe * PENSION.standardEmployeeRate;
        const tax = calculateIncomeTax(salary, pensionEmp);
        const ni = calculateEmployeeNI(salary);
        return salary - tax - ni - pensionEmp;
    }

    for (const emp of prEmployees) {
        const oldSal = emp.currentSalary || 0;
        const newSal = emp.newSalary || oldSal;
        const raisePct = oldSal > 0 ? ((newSal / oldSal) - 1) * 100 : 0;

        // Old costs
        const oldNI = calculateEmployerNI(oldSal, false);
        const oldQE = calculateQualifyingEarnings(oldSal);
        const oldPension = oldQE * PENSION.standardEmployerRate;
        const oldTotal = oldSal + oldNI + oldPension;

        // New costs
        const newNI = calculateEmployerNI(newSal, false);
        const newQE = calculateQualifyingEarnings(newSal);
        const newPension = newQE * PENSION.standardEmployerRate;
        const newTotal = newSal + newNI + newPension;

        const extraCost = newTotal - oldTotal;

        // Take-home estimates
        const oldTakeHome = estimateTakeHome(oldSal);
        const newTakeHome = estimateTakeHome(newSal);

        totalSalaryIncrease += (newSal - oldSal);
        totalNIIncrease += (newNI - oldNI);
        totalPensionIncrease += (newPension - oldPension);

        rows.push({
            name: emp.name || 'Unnamed',
            oldSal, newSal, raisePct,
            oldTotal, newTotal, extraCost,
            oldTakeHome, newTakeHome
        });
    }

    const totalExtraCost = totalSalaryIncrease + totalNIIncrease + totalPensionIncrease;

    // Show results
    $('#payrise-results').style.display = 'block';

    setText('pr-res-salary-increase', formatCurrency(totalSalaryIncrease));
    setText('pr-res-ni-increase', formatCurrency(totalNIIncrease));
    setText('pr-res-pension-increase', formatCurrency(totalPensionIncrease));
    setText('pr-res-total-increase', formatCurrency(totalExtraCost));

    setText('pr-res-monthly-extra', formatCurrency(totalExtraCost / 12));
    setText('pr-res-annual-extra', formatCurrency(totalExtraCost));

    // Build employer cost comparison table
    const tbody = $('#pr-results-table-body');
    tbody.innerHTML = '';

    for (const r of rows) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHtml(r.name)}</td>
            <td>${formatCurrency(r.oldSal)}</td>
            <td>${formatCurrency(r.newSal)}</td>
            <td>${r.raisePct.toFixed(1)}%</td>
            <td>${formatCurrency(r.oldTotal)}</td>
            <td>${formatCurrency(r.newTotal)}</td>
            <td class="${r.extraCost > 0 ? 'negative-text' : ''}">${r.extraCost > 0 ? '+' : ''}${formatCurrency(r.extraCost)}</td>
        `;
        tbody.appendChild(tr);
    }

    // Totals row
    const totalOld = rows.reduce((s, r) => s + r.oldTotal, 0);
    const totalNew = rows.reduce((s, r) => s + r.newTotal, 0);
    const totalsRow = document.createElement('tr');
    totalsRow.className = 'total-row';
    totalsRow.innerHTML = `
        <td><strong>Total</strong></td>
        <td><strong>${formatCurrency(rows.reduce((s, r) => s + r.oldSal, 0))}</strong></td>
        <td><strong>${formatCurrency(rows.reduce((s, r) => s + r.newSal, 0))}</strong></td>
        <td></td>
        <td><strong>${formatCurrency(totalOld)}</strong></td>
        <td><strong>${formatCurrency(totalNew)}</strong></td>
        <td class="negative-text"><strong>+${formatCurrency(totalExtraCost)}</strong></td>
    `;
    tbody.appendChild(totalsRow);

    // Build take-home comparison table
    const thBody = $('#pr-takehome-table-body');
    thBody.innerHTML = '';

    for (const r of rows) {
        const monthlyChange = (r.newTakeHome - r.oldTakeHome) / 12;
        const annualChange = r.newTakeHome - r.oldTakeHome;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHtml(r.name)}</td>
            <td>${formatCurrency(r.oldSal)}</td>
            <td>${formatCurrency(r.oldTakeHome / 12)}</td>
            <td>${formatCurrency(r.newTakeHome / 12)}</td>
            <td class="${monthlyChange > 0 ? 'positive-text' : ''}">${monthlyChange >= 0 ? '+' : '-'}${formatCurrency(Math.abs(monthlyChange))}</td>
            <td class="${annualChange > 0 ? 'positive-text' : ''}">${annualChange >= 0 ? '+' : '-'}${formatCurrency(Math.abs(annualChange))}</td>
        `;
        thBody.appendChild(tr);
    }

    // Take-home totals row
    const totalOldTH = rows.reduce((s, r) => s + r.oldTakeHome, 0);
    const totalNewTH = rows.reduce((s, r) => s + r.newTakeHome, 0);
    const thTotalsRow = document.createElement('tr');
    thTotalsRow.className = 'total-row';
    const thMonthlyChange = (totalNewTH - totalOldTH) / 12;
    const thAnnualChange = totalNewTH - totalOldTH;
    thTotalsRow.innerHTML = `
        <td><strong>Total</strong></td>
        <td></td>
        <td><strong>${formatCurrency(totalOldTH / 12)}</strong></td>
        <td><strong>${formatCurrency(totalNewTH / 12)}</strong></td>
        <td class="positive-text"><strong>+${formatCurrency(thMonthlyChange)}</strong></td>
        <td class="positive-text"><strong>+${formatCurrency(thAnnualChange)}</strong></td>
    `;
    thBody.appendChild(thTotalsRow);

    // Scroll to results
    $('#payrise-results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== Utility =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== LocalStorage Persistence =====
const STORAGE_KEY = 'uk-emp-calc-data';

function saveState() {
    const state = {
        // Active tab
        activeTab: $('.tab-btn.active')?.dataset.tab || 'employee',

        // Employee tab
        salaryIsMonthly: $('#salary-monthly').classList.contains('active'),
        empSalary: $('#emp-salary').value,
        empTaxCode: $('#emp-tax-code').value,
        empSlPlan1: $('#emp-sl-plan1').checked,
        empSlPlan2: $('#emp-sl-plan2').checked,
        empSlPlan4: $('#emp-sl-plan4').checked,
        empSlPlan5: $('#emp-sl-plan5').checked,
        empSlPostgrad: $('#emp-sl-postgrad').checked,
        empPensionStandard: $('#pension-standard').classList.contains('active'),
        empPensionEmployee: $('#emp-pension-employee').value,
        empPensionEmployer: $('#emp-pension-employer').value,
        empChildren: $('#emp-children').value,

        // Employer tab
        erSalaryIsMonthly: $('#er-salary-monthly').classList.contains('active'),
        erSalary: $('#er-salary').value,
        erPensionStandard: $('#er-pension-standard').classList.contains('active'),
        erPensionPct: $('#er-pension-pct').value,
        erEmploymentAllowance: $('#er-employment-allowance').checked,
        additionalCosts: additionalCosts,

        // Hiring tab
        hireRevenue: $('#hire-revenue').value,
        hireProfit: $('#hire-profit').value,
        hireCurrentPayroll: $('#hire-current-payroll').value,
        hireEmploymentAllowance: $('#hire-employment-allowance').checked,
        currentEmployees: currentEmployees,
        hireNewSalary: $('#hire-new-salary').value,
        hireNewPension: $('#hire-new-pension').value,
        hireNewExtras: $('#hire-new-extras').value,

        // Pay Rise tab
        prWorkforcePct: $('#pr-workforce-pct').value,
        prEmployees: prEmployees,
    };

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        // Silently fail if storage is full
    }
}

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const state = JSON.parse(raw);

        // Employee tab
        if (state.salaryIsMonthly) {
            $('#salary-monthly').click();
        }
        if (state.empSalary) $('#emp-salary').value = state.empSalary;
        if (state.empTaxCode) $('#emp-tax-code').value = state.empTaxCode;
        if (state.empSlPlan1) $('#emp-sl-plan1').checked = state.empSlPlan1;
        if (state.empSlPlan2) $('#emp-sl-plan2').checked = state.empSlPlan2;
        if (state.empSlPlan4) $('#emp-sl-plan4').checked = state.empSlPlan4;
        if (state.empSlPlan5) $('#emp-sl-plan5').checked = state.empSlPlan5;
        if (state.empSlPostgrad) $('#emp-sl-postgrad').checked = state.empSlPostgrad;
        if (state.empPensionStandard === false) {
            $('#pension-custom').click();
        }
        if (state.empPensionEmployee) $('#emp-pension-employee').value = state.empPensionEmployee;
        if (state.empPensionEmployer) $('#emp-pension-employer').value = state.empPensionEmployer;
        if (state.empChildren) $('#emp-children').value = state.empChildren;

        // Employer tab
        if (state.erSalaryIsMonthly) {
            $('#er-salary-monthly').click();
        }
        if (state.erSalary) $('#er-salary').value = state.erSalary;
        if (state.erPensionStandard === false) {
            $('#er-pension-custom').click();
        }
        if (state.erPensionPct) $('#er-pension-pct').value = state.erPensionPct;
        if (state.erEmploymentAllowance) $('#er-employment-allowance').checked = state.erEmploymentAllowance;
        if (state.additionalCosts && state.additionalCosts.length > 0) {
            additionalCosts = state.additionalCosts;
            renderAdditionalCosts();
        }

        // Hiring tab
        if (state.hireRevenue) $('#hire-revenue').value = state.hireRevenue;
        if (state.hireProfit) $('#hire-profit').value = state.hireProfit;
        if (state.hireCurrentPayroll) $('#hire-current-payroll').value = state.hireCurrentPayroll;
        if (state.hireEmploymentAllowance) $('#hire-employment-allowance').checked = state.hireEmploymentAllowance;
        if (state.currentEmployees && state.currentEmployees.length > 0) {
            currentEmployees = state.currentEmployees;
            renderEmployees();
        }
        if (state.hireNewSalary) $('#hire-new-salary').value = state.hireNewSalary;
        if (state.hireNewPension) $('#hire-new-pension').value = state.hireNewPension;
        if (state.hireNewExtras) $('#hire-new-extras').value = state.hireNewExtras;

        // Pay Rise tab
        if (state.prWorkforcePct) $('#pr-workforce-pct').value = state.prWorkforcePct;
        if (state.prEmployees && state.prEmployees.length > 0) {
            prEmployees = state.prEmployees;
            renderPrEmployees();
        }

        // Restore active tab (do this last)
        if (state.activeTab && state.activeTab !== 'employee') {
            const tabBtn = $(`[data-tab="${state.activeTab}"]`);
            if (tabBtn) tabBtn.click();
        }
    } catch (e) {
        // Silently fail on corrupt data
    }
}

function initAutoSave() {
    // Save on all input/change events within the main content
    document.addEventListener('input', debounce(saveState, 300));
    document.addEventListener('change', debounce(saveState, 300));

    // Save when tabs change
    $$('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => setTimeout(saveState, 50));
    });
}

function debounce(fn, ms) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}

// ===== Share =====
function shareCalculation() {
    const params = new URLSearchParams();
    const salary = $('#emp-salary').value;
    if (!salary) { alert('Calculate your take-home pay first!'); return; }

    params.set('s', salary);
    const taxCode = $('#emp-tax-code').value;
    if (taxCode && taxCode !== '1257L') params.set('tc', taxCode);
    if ($('#emp-sl-plan1').checked) params.set('sl1', '1');
    if ($('#emp-sl-plan2').checked) params.set('sl2', '1');
    if ($('#emp-sl-plan4').checked) params.set('sl4', '1');
    if ($('#emp-sl-plan5').checked) params.set('sl5', '1');
    if ($('#emp-sl-postgrad').checked) params.set('slpg', '1');

    const isStandard = $('#pension-standard').classList.contains('active');
    if (!isStandard) {
        params.set('pe', $('#emp-pension-employee').value || '0');
        params.set('pr', $('#emp-pension-employer').value || '0');
    }

    const children = $('#emp-children').value;
    if (children && children !== '0') params.set('ch', children);

    const baseUrl = window.location.href.split('?')[0].split('#')[0];
    const shareUrl = `${baseUrl}?${params.toString()}`;

    // Try native share API first (mobile), fallback to clipboard
    if (navigator.share) {
        navigator.share({
            title: `UK Take-Home Pay: ${formatCurrency(parseFloat(salary))} salary`,
            text: `Check out my UK take-home pay calculation for a £${Number(salary).toLocaleString()} salary`,
            url: shareUrl
        }).catch(() => {});
    } else {
        navigator.clipboard.writeText(shareUrl).then(() => {
            const btn = $('#btn-share-employee');
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
    if (!params.has('s')) return;

    $('#emp-salary').value = params.get('s');
    if (params.has('tc')) $('#emp-tax-code').value = params.get('tc');
    if (params.get('sl1') === '1') $('#emp-sl-plan1').checked = true;
    if (params.get('sl2') === '1') $('#emp-sl-plan2').checked = true;
    if (params.get('sl4') === '1') $('#emp-sl-plan4').checked = true;
    if (params.get('sl5') === '1') $('#emp-sl-plan5').checked = true;
    if (params.get('slpg') === '1') $('#emp-sl-postgrad').checked = true;

    if (params.has('pe')) {
        $('#pension-custom').click();
        $('#emp-pension-employee').value = params.get('pe');
        $('#emp-pension-employer').value = params.get('pr') || '0';
    }

    if (params.has('ch')) $('#emp-children').value = params.get('ch');

    // Auto-calculate
    setTimeout(() => calculateEmployee(), 100);
}

// ===== Print =====
function printResults() {
    window.print();
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initTabs();
    initPensionToggle();
    initSidebar();
    initMode();

    // Salary toggle (annual/monthly)
    $('#salary-annual').addEventListener('click', () => {
        $('#salary-annual').classList.add('active');
        $('#salary-monthly').classList.remove('active');
        $('#emp-salary').placeholder = 'e.g. 35000';
        $('#emp-salary').step = '100';
        $('#salary-conversion').style.display = 'none';
    });
    $('#salary-monthly').addEventListener('click', () => {
        $('#salary-monthly').classList.add('active');
        $('#salary-annual').classList.remove('active');
        $('#emp-salary').placeholder = 'e.g. 2917';
        $('#emp-salary').step = '10';
        const raw = parseFloat($('#emp-salary').value) || 0;
        if (raw > 0) {
            const badge = $('#salary-conversion');
            badge.textContent = `= ${formatCurrency(raw * 12)} per year`;
            badge.style.display = 'inline-block';
        }
    });

    // Employer salary toggle (annual/monthly)
    $('#er-salary-annual').addEventListener('click', () => {
        $('#er-salary-annual').classList.add('active');
        $('#er-salary-monthly').classList.remove('active');
        $('#er-salary').placeholder = 'e.g. 35000';
        $('#er-salary').step = '100';
        $('#er-salary-conversion').style.display = 'none';
    });
    $('#er-salary-monthly').addEventListener('click', () => {
        $('#er-salary-monthly').classList.add('active');
        $('#er-salary-annual').classList.remove('active');
        $('#er-salary').placeholder = 'e.g. 2917';
        $('#er-salary').step = '10';
        const raw = parseFloat($('#er-salary').value) || 0;
        if (raw > 0) {
            const badge = $('#er-salary-conversion');
            badge.textContent = `= ${formatCurrency(raw * 12)} per year`;
            badge.style.display = 'inline-block';
        }
    });

    $('#btn-calc-employee').addEventListener('click', calculateEmployee);
    $('#btn-calc-employer').addEventListener('click', calculateEmployer);
    $('#btn-calc-hiring').addEventListener('click', calculateHiring);
    $('#btn-calc-payroll').addEventListener('click', calculatePayrollSummary);
    $('#btn-calc-payrise').addEventListener('click', calculatePayRise);

    // Additional costs
    $('#btn-add-cost').addEventListener('click', () => { addAdditionalCost(); saveState(); });
    // Allow enter key to add cost
    $('#add-cost-amount').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { addAdditionalCost(); saveState(); }
    });
    $('#add-cost-name').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { addAdditionalCost(); saveState(); }
    });

    // Add employee buttons
    $('#btn-add-employee').addEventListener('click', () => { addEmployeeRow(); saveState(); });
    $('#btn-add-pr-employee').addEventListener('click', () => { addPrEmployeeRow(); saveState(); });
    $('#btn-apply-workforce-raise').addEventListener('click', () => { applyWorkforceRaise(); saveState(); });
    $('#btn-copy-from-hiring').addEventListener('click', copyFromHiring);

    // Allow enter key to trigger calculations
    $('#emp-salary').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') calculateEmployee();
    });
    $('#er-salary').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') calculateEmployer();
    });
    $('#hire-new-salary').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') calculateHiring();
    });

    // Print & Share
    $('#btn-print-employee').addEventListener('click', printResults);
    $('#btn-share-employee').addEventListener('click', shareCalculation);

    // Load saved state and start auto-saving
    loadState();
    loadFromUrl(); // URL params override localStorage
    initAutoSave();
});
