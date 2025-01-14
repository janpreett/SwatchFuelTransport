import { db } from './firebaseConfig.js';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

const expenseCategory = document.getElementById('expense-category');
const addExpenseButton = document.getElementById('add-expense-button');
const viewExpenseButton = document.getElementById('view-expense-button');
const expenseFormContainer = document.getElementById('expense-form-container');
const expenseListContainer = document.getElementById('expense-list-container');
const searchInput = document.getElementById('expense-search');

const categoriesWithSubcategories = ['truck', 'tanker','diesel'];
const subcategories = {
    'truck': ['Cti', 'Prime-Truck', 'SWS Fuel'],
    'tanker': ['Cti', 'Prime-Truck', 'SWS Fuel'],
    'diesel': ['Sartaj', 'Burlington','Deptford', 'SWS Fuel',]
};

let editingExpenseId = null;
window.sortOrder = {
    date: 'asc',
    price: 'asc',
    subCategory: 'asc',
    gallon: 'asc',
    amount: 'asc',
    truckNum: 'asc',
    tankerNum: 'asc',
    company: 'asc'
};

function setupSearch() {
    const searchInput = document.getElementById('expense-search');
    const startDate = document.getElementById('start-date');
    const endDate = document.getElementById('end-date');
    if (!searchInput) return;

    function filterRows() {
        const searchTerm = searchInput.value.toLowerCase();
        const startDateVal = startDate.value ? new Date(startDate.value) : null;
        const endDateVal = endDate.value ? new Date(endDate.value) : null;
        
        const rows = document.querySelectorAll('#expense-list-container table tr:not(:first-child):not(:last-child)');
        let totalPrice = 0;
        let totalAmount = 0;
        let totalGallon = 0;

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const rowText = Array.from(cells).map(cell => cell.textContent).join(' ').toLowerCase();
            const rowDate = new Date(cells[0].textContent);
            
            const matchesSearch = rowText.includes(searchTerm);
            const matchesDateRange = (!startDateVal || rowDate >= startDateVal) && 
                                   (!endDateVal || rowDate <= endDateVal);
            
            const isVisible = matchesSearch && matchesDateRange;
            row.style.display = isVisible ? '' : 'none';

            if (isVisible) {
                const category = expenseCategory.value;
                if (category === 'diesel') {
                    totalGallon += parseFloat(cells[3].textContent) || 0;
                    totalPrice += parseFloat(cells[4].textContent.replace('$', '')) || 0;
                } else if (category === 'truck' || category === 'tanker') {
                    totalPrice += parseFloat(cells[5].textContent.replace('$', '')) || 0;
                } else {
                    totalAmount += parseFloat(cells[cells.length - 2].textContent.replace('$', '')) || 0;
                }
            }
        });

        // Update totals
        const category = expenseCategory.value;
        const totalRow = document.querySelector('#expense-list-container table tr:last-child');
        if (totalRow) {
            if (category === 'diesel') {
                totalRow.querySelector('td:nth-last-child(3)').textContent = totalGallon.toFixed(2);
                totalRow.querySelector('td:nth-last-child(2)').textContent = `$${totalPrice.toFixed(2)}`;
            } else if (category === 'truck' || category === 'tanker') {
                totalRow.querySelector('td:nth-last-child(2)').textContent = `$${totalPrice.toFixed(2)}`;
            } else {
                totalRow.querySelector('td:nth-last-child(2)').textContent = `$${totalAmount.toFixed(2)}`;
            }
        }
    }

    searchInput.addEventListener('input', filterRows);
    startDate.addEventListener('change', filterRows);
    endDate.addEventListener('change', filterRows);
    window.currentFilter = filterRows;
}

addExpenseButton.addEventListener('click', () => {
    const category = expenseCategory.value;
    renderSubcategoryForm(category);
    expenseFormContainer.classList.remove('hidden');
    expenseListContainer.classList.add('hidden');
});

viewExpenseButton.addEventListener('click', () => {
    const category = expenseCategory.value;
    renderExpenseList(category);
    expenseFormContainer.classList.add('hidden');
    expenseListContainer.classList.remove('hidden');
});

function renderSubcategoryForm(category) {
    expenseFormContainer.innerHTML = '';

    if (categoriesWithSubcategories.includes(category)) {
        expenseFormContainer.innerHTML = `
            <label for="sub-category">Select Sub-Category:</label>
            <select id="sub-category">
                ${subcategories[category].map(sub => `<option value="${sub}">${sub.replace('-', ' ').toUpperCase()}</option>`).join('')}
            </select>
        `;
    }

    renderExpenseForm(category);
}
function renderExpenseForm(category, expenseData = {}) {
    expenseFormContainer.innerHTML = '';

    let formHtml = `<form id="expense-form">`;
    formHtml += `<label for="date">Date:</label><input type="date" id="date" value="${expenseData.date || ''}" required>`;
    formHtml += `<label for="company">Company:</label>
        <select id="company" required>
            <option value="SWS" ${expenseData.company === 'SWS' ? 'selected' : ''}>SWS</option>
            <option value="Swatch Fuel" ${expenseData.company === 'Swatch Fuel' ? 'selected' : ''}>Swatch Fuel</option>
        </select>`;

    if (category === 'truck') {
        formHtml += `<label for="sub-category">Select Sub-Category:</label><select id="sub-category">${subcategories['truck'].map(sub => `<option value="${sub}" ${expenseData.subCategory === sub ? 'selected' : ''}>${sub.replace('-', ' ').toUpperCase()}</option>`).join('')}</select>`;
        formHtml += `<label for="truck-num">Truck #:</label><input type="text" id="truck-num" value="${expenseData.truckNum || ''}" required>`;
        formHtml += `<label for="repair-info">Repair Info:</label><textarea id="repair-info" rows="4" cols="50" required>${expenseData.repairInfo || ''}</textarea>`;
        formHtml += `<label for="price">Price:</label><input type="number" id="price" step="0.01" value="${expenseData.price || ''}" required>`;
    } else if (category === 'tanker') {
        formHtml += `<label for="sub-category">Select Sub-Category:</label><select id="sub-category">${subcategories['tanker'].map(sub => `<option value="${sub}" ${expenseData.subCategory === sub ? 'selected' : ''}>${sub.replace('-', ' ').toUpperCase()}</option>`).join('')}</select>`;
        formHtml += `<label for="tanker-num">Tanker #:</label><input type="text" id="tanker-num" value="${expenseData.tankerNum || ''}" required>`;
        formHtml += `<label for="repair-info">Repair Info:</label><textarea id="repair-info" rows="4" cols="50" required>${expenseData.repairInfo || ''}</textarea>`;
        formHtml += `<label for="price">Price:</label><input type="number" id="price" step="0.01" value="${expenseData.price || ''}" required>`;
    } else if (category === 'dmv' || category === 'parts' || category === 'phone-tracker' || category === 'other' || category === 'office-supply') {
        formHtml += `<label for="description">Description:</label><textarea id="description" rows="4" cols="50" required>${expenseData.description || ''}</textarea>`;
        formHtml += `<label for="amount">Amount:</label><input type="number" id="amount" step="0.01" value="${expenseData.amount || ''}" required>`;
    } else if (category === 'toll' || category === 'parking' || category === 'def') {
        formHtml += `<label for="amount">Amount:</label><input type="number" id="amount" step="0.01" value="${expenseData.amount || ''}" required>`;
    } else if (category === 'diesel') {
        formHtml += `<label for="sub-category">Select Sub-Category:</label><select id="sub-category">${subcategories['diesel'].map(sub => `<option value="${sub}" ${expenseData.subCategory === sub ? 'selected' : ''}>${sub.replace('-', ' ').toUpperCase()}</option>`).join('')}</select>`;
        formHtml += `<label for="gallon">Gallon:</label><input type="number" id="gallon" step="0.01" value="${expenseData.gallon || ''}" required>`;
        formHtml += `<label for="price">Price:</label><input type="number" id="price" step="0.01" value="${expenseData.price || ''}" required>`;
    }

    formHtml += `<button type="submit">${editingExpenseId ? 'Update' : 'Submit'}</button></form>`;

    expenseFormContainer.innerHTML = formHtml;

    document.getElementById('expense-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const date = document.getElementById('date').value;
        const company = document.getElementById('company').value;
        const selectedSubCategory = document.getElementById('sub-category') ? document.getElementById('sub-category').value : '';

        let data = { category, subCategory: selectedSubCategory || '', date, company };

        if (category === 'truck') {
            data.truckNum = document.getElementById('truck-num').value;
            data.repairInfo = document.getElementById('repair-info').value;
            data.price = document.getElementById('price').value;
        } else if (category === 'tanker') {
            data.tankerNum = document.getElementById('tanker-num').value;
            data.repairInfo = document.getElementById('repair-info').value;
            data.price = document.getElementById('price').value;
        } else if (category === 'dmv' || category === 'parts' || category === 'phone-tracker' || category === 'other' || category === 'office-supply') {
            data.description = document.getElementById('description').value;
            data.amount = document.getElementById('amount').value;
        } else if (category === 'toll' || category === 'parking' || category === 'def') {
            data.amount = document.getElementById('amount').value;
        } else if (category === 'diesel') {
            data.subCategory = selectedSubCategory;
            data.gallon = document.getElementById('gallon').value;
            data.price = document.getElementById('price').value;
        }

        try {
            if (editingExpenseId) {
                await updateDoc(doc(db, 'expenses', editingExpenseId), data);
                expenseFormContainer.innerHTML = '<p>Expense updated successfully!</p>';
                editingExpenseId = null;
            } else {
                await addDoc(collection(db, 'expenses'), data);
                expenseFormContainer.innerHTML = '<p>Expense added successfully!</p>';
            }
        } catch (error) {
            console.error("Error saving expense: ", error);
            expenseFormContainer.innerHTML = `<p>Error saving expense. Please try again.</p>`;
        }
    });
}

async function renderExpenseList(category) {
    expenseListContainer.innerHTML = '';
    expenseFormContainer.classList.add('hidden');

    try {
        const expensesQuery = query(collection(db, 'expenses'), where('category', '==', category));
        const querySnapshot = await getDocs(expensesQuery);

        let expenses = [];
        querySnapshot.forEach((doc) => {
            expenses.push({ id: doc.id, ...doc.data() });
        });

        function renderTable() {
            let expenseListHtml = `
                <div class="search-container">
                    <div class="search-section">
                        <h3>Search by Keyword:</h3>
                        <input type="text" id="expense-search" placeholder="Search expenses...">
                    </div>
                    <div class="date-range-section">
                        <h3>Filter by Date Range:</h3>
                        <input type="date" id="start-date" placeholder="Start Date">
                        <input type="date" id="end-date" placeholder="End Date">
                    </div>
                </div>
                <table style="width:100%;border-collapse:collapse;">
            `;

            if (category === 'truck') {
                expenseListHtml += '<tr><th style="border: 1px solid #ddd;padding: 8px;cursor:pointer;" onclick="sortExpenses(\'date\')">Date</th><th style="border: 1px solid #ddd;padding: 8px;cursor:pointer;" onclick="sortExpenses(\'company\')">Company</th><th style="border: 1px solid #ddd;padding: 8px;cursor:pointer;" onclick="sortExpenses(\'subCategory\')">Sub-Category</th><th style="border: 1px solid #ddd;padding: 8px;cursor:pointer;" onclick="sortExpenses(\'truckNum\')">Truck #</th><th style="border: 1px solid #ddd;padding: 8px;">Repair Info</th><th style="border: 1px solid #ddd;padding: 8px;cursor:pointer;" onclick="sortExpenses(\'price\')">Price</th><th style="border: 1px solid #ddd;padding: 8px;">Actions</th></tr>';
            } else if (category === 'tanker') {
                expenseListHtml += '<tr><th style="border: 1px solid #ddd;padding: 8px;cursor:pointer;" onclick="sortExpenses(\'date\')">Date</th><th style="border: 1px solid #ddd;padding: 8px;cursor:pointer;" onclick="sortExpenses(\'company\')">Company</th><th style="border: 1px solid #ddd;padding: 8px;cursor:pointer;" onclick="sortExpenses(\'subCategory\')">Sub-Category</th><th style="border: 1px solid #ddd;padding: 8px;cursor:pointer;" onclick="sortExpenses(\'tankerNum\')">Tanker #</th><th style="border: 1px solid #ddd;padding: 8px;">Repair Info</th><th style="border: 1px solid #ddd;padding: 8px;cursor:pointer;" onclick="sortExpenses(\'price\')">Price</th><th style="border: 1px solid #ddd;padding: 8px;">Actions</th></tr>';
            } else if (category === 'dmv' || category === 'parts' || category === 'phone-tracker' || category === 'other' || category === 'office-supply') {
                expenseListHtml += '<tr><th style="border: 1px solid #ddd;padding: 8px;cursor:pointer;" onclick="sortExpenses(\'date\')">Date</th><th style="border: 1px solid #ddd;padding: 8px;cursor:pointer;" onclick="sortExpenses(\'company\')">Company</th><th style="border: 1px solid #ddd;padding: 8px;">Description</th><th style="border: 1px solid #ddd;padding: 8px;cursor:pointer;" onclick="sortExpenses(\'amount\')">Amount</th><th style="border: 1px solid #ddd;padding: 8px;">Actions</th></tr>';
            } else if (category === 'toll' || category === 'parking' || category === 'def') {
                expenseListHtml += '<tr><th style="border: 1px solid #ddd;padding: 8px;cursor:pointer;" onclick="sortExpenses(\'date\')">Date</th><th style="border: 1px solid #ddd;padding: 8px;cursor:pointer;" onclick="sortExpenses(\'company\')">Company</th><th style="border: 1px solid #ddd;padding: 8px;cursor:pointer;" onclick="sortExpenses(\'amount\')">Amount</th><th style="border: 1px solid #ddd;padding: 8px;">Actions</th></tr>';
            } else if (category === 'diesel') {
                expenseListHtml += '<tr><th style="border: 1px solid #ddd;padding: 8px;cursor:pointer;" onclick="sortExpenses(\'date\')">Date</th><th style="border: 1px solid #ddd;padding: 8px;cursor:pointer;" onclick="sortExpenses(\'company\')">Company</th><th style="border: 1px solid #ddd;padding: 8px;cursor:pointer;" onclick="sortExpenses(\'subCategory\')">Sub-Category</th><th style="border: 1px solid #ddd;padding: 8px;cursor:pointer;" onclick="sortExpenses(\'gallon\')">Gallon</th><th style="border: 1px solid #ddd;padding: 8px;cursor:pointer;" onclick="sortExpenses(\'price\')">Price</th><th style="border: 1px solid #ddd;padding: 8px;">Actions</th></tr>';
            }

            let totalPrice = 0;
            let totalAmount = 0;
            let totalGallon = 0;

            expenses.forEach((expense) => {
                expenseListHtml += '<tr>';
                if (category === 'truck') {
                    expenseListHtml += `<td style="border: 1px solid #ddd;padding: 8px;">${expense.date}</td>`;
                    expenseListHtml += `<td style="border: 1px solid #ddd;padding: 8px;">${expense.company}</td>`;
                    expenseListHtml += `<td style="border: 1px solid #ddd;padding: 8px;">${expense.subCategory}</td>`;
                    expenseListHtml += `<td style="border: 1px solid #ddd;padding: 8px;">${expense.truckNum}</td>`;
                    expenseListHtml += `<td style="border: 1px solid #ddd;padding: 8px;">${expense.repairInfo}</td>`;
                    expenseListHtml += `<td style="border: 1px solid #ddd;padding: 8px;">$${expense.price}</td>`;
                    totalPrice += parseFloat(expense.price) || 0;
                } else if (category === 'tanker') {
                    expenseListHtml += `<td style="border: 1px solid #ddd;padding: 8px;">${expense.date}</td>`;
                    expenseListHtml += `<td style="border: 1px solid #ddd;padding: 8px;">${expense.company}</td>`;
                    expenseListHtml += `<td style="border: 1px solid #ddd;padding: 8px;">${expense.subCategory}</td>`;
                    expenseListHtml += `<td style="border: 1px solid #ddd;padding: 8px;">${expense.tankerNum}</td>`;
                    expenseListHtml += `<td style="border: 1px solid #ddd;padding: 8px;">${expense.repairInfo}</td>`;
                    expenseListHtml += `<td style="border: 1px solid #ddd;padding: 8px;">$${expense.price}</td>`;
                    totalPrice += parseFloat(expense.price) || 0;
                } else if (category === 'dmv' || category === 'parts' || category === 'phone-tracker' || category === 'other' || category === 'office-supply') {
                    expenseListHtml += `<td style="border: 1px solid #ddd;padding: 8px;">${expense.date}</td>`;
                    expenseListHtml += `<td style="border: 1px solid #ddd;padding: 8px;">${expense.company}</td>`;
                    expenseListHtml += `<td style="border: 1px solid #ddd;padding: 8px;">${expense.description}</td>`;
                    expenseListHtml += `<td style="border: 1px solid #ddd;padding: 8px;">$${expense.amount}</td>`;
                    totalAmount += parseFloat(expense.amount) || 0;
                } else if (category === 'toll' || category === 'parking' || category === 'def') {
                    expenseListHtml += `<td style="border: 1px solid #ddd;padding: 8px;">${expense.date}</td>`;
                    expenseListHtml += `<td style="border: 1px solid #ddd;padding: 8px;">${expense.company}</td>`;
                    expenseListHtml += `<td style="border: 1px solid #ddd;padding: 8px;">$${expense.amount}</td>`;
                    totalAmount += parseFloat(expense.amount) || 0;
                } else if (category === 'diesel') {
                    expenseListHtml += `<td style="border: 1px solid #ddd;padding: 8px;">${expense.date}</td>`;
                    expenseListHtml += `<td style="border: 1px solid #ddd;padding: 8px;">${expense.company}</td>`;
                    expenseListHtml += `<td style="border: 1px solid #ddd;padding: 8px;">${expense.subCategory}</td>`;
                    expenseListHtml += `<td style="border: 1px solid #ddd;padding: 8px;">${expense.gallon}</td>`;
                    expenseListHtml += `<td style="border: 1px solid #ddd;padding: 8px;">$${expense.price}</td>`;
                    totalGallon += parseFloat(expense.gallon) || 0;
                    totalPrice += parseFloat(expense.price) || 0;
                }
                expenseListHtml += `<td style="border: 1px solid #ddd;padding: 8px;"><button onclick="editExpense('${expense.id}')">Edit</button><button onclick="deleteExpense('${expense.id}')">Delete</button></td>`;
                expenseListHtml += '</tr>';
            });

            expenseListHtml += '<tr>';
            if (category === 'truck' || category === 'tanker') {
                expenseListHtml += '<td colspan="5" style="border: 1px solid #ddd;padding: 8px;text-align:right;">Total:</td>';
                expenseListHtml += `<td style="border: 1px solid #ddd;padding: 8px;">$${totalPrice.toFixed(2)}</td>`;
            } else if (category === 'dmv' || category === 'parts' || category === 'phone-tracker' || category === 'other' || category === 'office-supply') {
                expenseListHtml += '<td colspan="3" style="border: 1px solid #ddd;padding: 8px;text-align:right;">Total:</td>';
                expenseListHtml += `<td style="border: 1px solid #ddd;padding: 8px;">$${totalAmount.toFixed(2)}</td>`;
            } else if (category === 'toll' || category === 'parking' || category === 'def') {
                expenseListHtml += '<td colspan="2" style="border: 1px solid #ddd;padding: 8px;text-align:right;">Total:</td>';
                expenseListHtml += `<td style="border: 1px solid #ddd;padding: 8px;">$${totalAmount.toFixed(2)}</td>`;
            } else if (category === 'diesel') {
                expenseListHtml += '<td colspan="3" style="border: 1px solid #ddd;padding: 8px;text-align:right;">Total:</td>';
                expenseListHtml += `<td style="border: 1px solid #ddd;padding: 8px;">${totalGallon.toFixed(2)}</td>`;
                expenseListHtml += `<td style="border: 1px solid #ddd;padding: 8px;">$${totalPrice.toFixed(2)}</td>`;
            }
            expenseListHtml += '<td style="border: 1px solid #ddd;padding: 8px;"></td>';
            expenseListHtml += '</tr>';

            expenseListHtml += '</table>';
            expenseListContainer.innerHTML = expenseListHtml;
        }

        renderTable();
        setupSearch();
    } catch (error) {
        console.error('Error getting expenses: ', error);
    }
}

window.renderExpenseList = renderExpenseList;
window.editExpense = async (expenseId) => {
    try {
        const expenseDocRef = doc(db, 'expenses', expenseId);
        const expenseDoc = await getDoc(expenseDocRef);

        if (expenseDoc.exists()) {
            const expenseData = expenseDoc.data();
            editingExpenseId = expenseId;
            renderExpenseForm(expenseData.category, expenseData);
            expenseFormContainer.classList.remove('hidden');
            expenseListContainer.classList.add('hidden');
        } else {
            throw new Error('No such document!');
        }
    } catch (error) {
        console.error("Error fetching expense for editing: ", error);
        alert('Error fetching expense. Please try again.');
    }
};

window.deleteExpense = async (expenseId) => {
    try {
        await deleteDoc(doc(db, 'expenses', expenseId));
        alert('Expense deleted successfully!');
        const category = expenseCategory.value;
        renderExpenseList(category);
    } catch (error) {
        console.error("Error deleting expense: ", error);
        alert('Error deleting expense. Please try again.');
    }
};

window.sortExpenses = function(attribute) {
    const direction = sortOrder[attribute] === 'asc' ? 1 : -1;
    const table = document.querySelector('#expense-list-container table');
    const tbody = table.querySelector('tbody') || table;
    
    // Get only the data rows, excluding header and total rows
    const rows = Array.from(tbody.querySelectorAll('tr')).filter((row, index) => {
        return index !== 0 && row !== tbody.lastElementChild;
    });
    
    rows.sort((a, b) => {
        let aValue = getCellValue(a, attribute);
        let bValue = getCellValue(b, attribute);
        return direction * compareValues(aValue, bValue);
    });

    // Preserve header row
    const headerRow = tbody.querySelector('tr:first-child');
    const totalRow = tbody.querySelector('tr:last-child');
    
    // Clear and rebuild table body with correct order
    tbody.innerHTML = '';
    tbody.appendChild(headerRow);
    rows.forEach(row => tbody.appendChild(row));
    tbody.appendChild(totalRow);

    sortOrder[attribute] = direction === 1 ? 'desc' : 'asc';
    
    if (window.currentFilter) {
        window.currentFilter();
    }
};

function getCellValue(row, attribute) {
    const index = getColumnIndex(attribute);
    const cell = row.cells[index];
    const value = cell.textContent.trim();

    if (attribute === 'date') return new Date(value);
    if (attribute === 'price' || attribute === 'amount') return parseFloat(value.replace('$', '')) || 0;
    if (attribute === 'gallon') return parseFloat(value) || 0;
    return value;
}

function compareValues(a, b) {
    if (a instanceof Date && b instanceof Date) return a - b;
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b));
}

function getColumnIndex(attribute) {
    const category = expenseCategory.value;
    const columnMap = {
        date: 0,
        company: 1,
        subCategory: 2,
        truckNum: 3,
        tankerNum: 3,
        gallon: 3,
        price: category === 'diesel' ? 4 : 5,
        amount: category === 'toll' || category === 'parking' || category === 'def' ? 2 : 3
    };
    return columnMap[attribute] || 0;
}