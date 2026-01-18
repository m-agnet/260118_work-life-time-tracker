// Records listing functionality
class RecordsPage {
    constructor() {
        this.currentFilter = 'all';
        this.deleteTargetId = null;
        this.records = [];

        this.initElements();
        this.attachEventListeners();
        this.loadRecords();
    }

    initElements() {
        this.recordsTableBody = document.getElementById('recordsTableBody');
        this.noRecords = document.getElementById('noRecords');
        this.deleteModal = document.getElementById('deleteModal');
        this.confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        this.cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        this.filterBtns = document.querySelectorAll('.filter-btn');
    }

    attachEventListeners() {
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterBtns.forEach(b => b.classList.remove('bg-blue-500', 'text-white'));
                this.filterBtns.forEach(b => b.classList.add('bg-gray-300', 'text-gray-700'));
                e.target.classList.remove('bg-gray-300', 'text-gray-700');
                e.target.classList.add('bg-blue-500', 'text-white');
                this.currentFilter = e.target.dataset.filter;
                this.loadRecords();
            });
        });

        this.confirmDeleteBtn.addEventListener('click', () => this.confirmDelete());
        this.cancelDeleteBtn.addEventListener('click', () => this.closeDeleteModal());
    }

    getDateRange() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let startDate = null;
        let endDate = new Date();

        switch (this.currentFilter) {
            case 'today':
                startDate = today;
                break;
            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                startDate = weekStart;
                break;
            case 'month':
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                startDate = monthStart;
                break;
        }

        return { startDate, endDate };
    }

    async loadRecords() {
        try {
            let url = '/api/records?limit=1000';

            if (this.currentFilter !== 'all') {
                const { startDate, endDate } = this.getDateRange();
                if (startDate) {
                    url += `&start_date=${startDate.toISOString()}`;
                    url += `&end_date=${endDate.toISOString()}`;
                }
            }

            const response = await fetch(url);
            this.records = await response.json();

            this.renderRecords();
        } catch (error) {
            console.error('Error loading records:', error);
        }
    }

    renderRecords() {
        this.recordsTableBody.innerHTML = '';

        if (this.records.length === 0) {
            this.noRecords.classList.remove('hidden');
            return;
        }

        this.noRecords.classList.add('hidden');

        this.records.forEach(record => {
            const row = this.createRecordRow(record);
            this.recordsTableBody.appendChild(row);
        });
    }

    createRecordRow(record) {
        const row = document.createElement('tr');

        const startTime = new Date(record.start_time);
        const duration = this.formatDuration(record.duration);
        const tags = record.tags.map(t => t.name).join(', ');

        row.innerHTML = `
            <td class="px-4 py-3 text-sm text-gray-900">${startTime.toLocaleString('ja-JP')}</td>
            <td class="px-4 py-3 text-sm text-gray-900">${duration}</td>
            <td class="px-4 py-3 text-sm text-gray-600">
                ${tags ? `<span class="inline-flex flex-wrap gap-1">${tags.split(', ').map(t => `<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">${t}</span>`).join('')}</span>` : '-'}
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">${record.description || '-'}</td>
            <td class="px-4 py-3 text-sm text-gray-600">
                <button class="text-red-500 hover:text-red-700 delete-btn" data-id="${record.id}">削除</button>
            </td>
        `;

        const deleteBtn = row.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            this.deleteTargetId = record.id;
            this.showDeleteModal();
        });

        return row;
    }

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        let result = '';
        if (hours > 0) result += `${hours}時間`;
        if (minutes > 0) result += `${minutes}分`;
        if (secs > 0) result += `${secs}秒`;

        return result || '0秒';
    }

    showDeleteModal() {
        this.deleteModal.classList.remove('hidden');
    }

    closeDeleteModal() {
        this.deleteModal.classList.add('hidden');
        this.deleteTargetId = null;
    }

    async confirmDelete() {
        if (!this.deleteTargetId) return;

        try {
            const response = await fetch(`/api/records/${this.deleteTargetId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete record');
            }

            this.closeDeleteModal();
            this.loadRecords();
        } catch (error) {
            console.error('Error deleting record:', error);
            alert('削除に失敗しました');
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new RecordsPage();
});
