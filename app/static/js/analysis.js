// Analysis page functionality
class AnalysisPage {
    constructor() {
        this.currentPeriod = 'all';
        this.tagChart = null;
        this.dateChart = null;
        this.summary = null;

        this.initElements();
        this.attachEventListeners();
        this.loadSummary();
    }

    initElements() {
        this.periodBtns = document.querySelectorAll('.period-btn');
        this.totalDurationEl = document.getElementById('totalDuration');
        this.recordCountEl = document.getElementById('recordCount');
        this.avgDurationEl = document.getElementById('avgDuration');
        this.tagChartCanvas = document.getElementById('tagChart');
        this.dateChartCanvas = document.getElementById('dateChart');
        this.tagTableBody = document.getElementById('tagTableBody');
    }

    attachEventListeners() {
        this.periodBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.periodBtns.forEach(b => b.classList.remove('bg-blue-500', 'text-white'));
                this.periodBtns.forEach(b => b.classList.add('bg-gray-300', 'text-gray-700'));
                e.target.classList.remove('bg-gray-300', 'text-gray-700');
                e.target.classList.add('bg-blue-500', 'text-white');
                this.currentPeriod = e.target.dataset.period;
                this.loadSummary();
            });
        });
    }

    getDateRange() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let startDate = null;
        let endDate = new Date();

        switch (this.currentPeriod) {
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

    async loadSummary() {
        try {
            let url = '/api/records/summary';

            if (this.currentPeriod !== 'all') {
                const { startDate, endDate } = this.getDateRange();
                if (startDate) {
                    url += `?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`;
                }
            }

            const response = await fetch(url);
            this.summary = await response.json();

            this.updateStats();
            this.renderCharts();
            this.renderTagTable();
        } catch (error) {
            console.error('Error loading summary:', error);
        }
    }

    updateStats() {
        // Calculate total duration
        const totalSeconds = this.summary.by_tag.reduce((sum, item) => sum + item.total_duration, 0);
        this.totalDurationEl.textContent = this.formatDuration(totalSeconds);

        // Calculate record count
        const recordCount = this.summary.by_date.reduce((sum, item) => sum + item.record_count, 0);
        this.recordCountEl.textContent = recordCount;

        // Calculate average duration
        const avgSeconds = recordCount > 0 ? Math.floor(totalSeconds / recordCount) : 0;
        this.avgDurationEl.textContent = this.formatDurationShort(avgSeconds);
    }

    renderCharts() {
        // Destroy existing charts
        if (this.tagChart) this.tagChart.destroy();
        if (this.dateChart) this.dateChart.destroy();

        // Tag chart
        const tagLabels = this.summary.by_tag.map(t => t.tag_name);
        const tagData = this.summary.by_tag.map(t => Math.round(t.total_duration / 60)); // Convert to minutes

        const tagCtx = this.tagChartCanvas.getContext('2d');
        this.tagChart = new Chart(tagCtx, {
            type: 'doughnut',
            data: {
                labels: tagLabels.length > 0 ? tagLabels : ['データなし'],
                datasets: [{
                    data: tagData.length > 0 ? tagData : [1],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(153, 102, 255, 0.8)',
                        'rgba(255, 159, 64, 0.8)',
                        'rgba(199, 199, 199, 0.8)',
                        'rgba(83, 102, 255, 0.8)',
                    ],
                    borderColor: 'white',
                    borderWidth: 2,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                },
            },
        });

        // Date chart
        const dateLabels = this.summary.by_date.slice(0, 30).map(d => d.date).reverse();
        const dateData = this.summary.by_date.slice(0, 30).map(d => Math.round(d.total_duration / 60)).reverse(); // Convert to minutes

        const dateCtx = this.dateChartCanvas.getContext('2d');
        this.dateChart = new Chart(dateCtx, {
            type: 'bar',
            data: {
                labels: dateLabels.length > 0 ? dateLabels : ['データなし'],
                datasets: [{
                    label: '作業時間（分）',
                    data: dateData.length > 0 ? dateData : [0],
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return value + '分';
                            },
                        },
                    },
                },
                plugins: {
                    legend: {
                        display: true,
                    },
                },
            },
        });
    }

    renderTagTable() {
        this.tagTableBody.innerHTML = '';

        if (this.summary.by_tag.length === 0) {
            this.tagTableBody.innerHTML = '<tr><td colspan="3" class="px-4 py-3 text-center text-gray-500">データがありません</td></tr>';
            return;
        }

        const totalDuration = this.summary.by_tag.reduce((sum, item) => sum + item.total_duration, 0);

        this.summary.by_tag.forEach(item => {
            const row = document.createElement('tr');
            const percentage = totalDuration > 0 ? ((item.total_duration / totalDuration) * 100).toFixed(1) : 0;

            row.innerHTML = `
                <td class="px-4 py-3 text-sm text-gray-900 font-medium">${item.tag_name}</td>
                <td class="px-4 py-3 text-sm text-gray-900">${this.formatDuration(item.total_duration)}</td>
                <td class="px-4 py-3 text-sm text-gray-900">
                    <div class="flex items-center gap-2">
                        <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div class="h-full bg-blue-500" style="width: ${percentage}%"></div>
                        </div>
                        <span>${percentage}%</span>
                    </div>
                </td>
            `;

            this.tagTableBody.appendChild(row);
        });
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

    formatDurationShort(seconds) {
        if (seconds < 60) {
            return `${seconds}秒`;
        } else if (seconds < 3600) {
            return `${Math.floor(seconds / 60)}分`;
        } else {
            return `${Math.floor(seconds / 3600)}時間${Math.floor((seconds % 3600) / 60)}分`;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AnalysisPage();
});
