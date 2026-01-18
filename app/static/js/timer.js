// Timer functionality
class Timer {
    constructor() {
        this.startTime = null;
        this.elapsedTime = 0;
        this.isRunning = false;
        this.intervalId = null;
        this.selectedTagIds = new Set();
        this.newTags = new Set();

        this.initElements();
        this.attachEventListeners();
        this.loadTags();
        this.loadRecentRecords();
    }

    initElements() {
        this.timerDisplay = document.getElementById('timer');
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.saveForm = document.getElementById('saveForm');
        this.descriptionInput = document.getElementById('description');
        this.saveBtn = document.getElementById('saveBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.displayDuration = document.getElementById('displayDuration');
        this.tagList = document.getElementById('tagList');
        this.newTagInput = document.getElementById('newTagInput');
        this.addTagBtn = document.getElementById('addTagBtn');
        this.selectedTagsDisplay = document.getElementById('selectedTags');
        this.recentRecords = document.getElementById('recentRecords');
    }

    attachEventListeners() {
        this.startBtn.addEventListener('click', () => this.start());
        this.stopBtn.addEventListener('click', () => this.stop());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.saveBtn.addEventListener('click', () => this.save());
        this.cancelBtn.addEventListener('click', () => this.cancelSave());
        this.addTagBtn.addEventListener('click', () => this.addNewTag());
        this.newTagInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addNewTag();
        });
    }

    async loadTags() {
        try {
            const response = await fetch('/api/tags');
            const tags = await response.json();

            this.tagList.innerHTML = '';
            tags.forEach(tag => {
                const label = document.createElement('label');
                label.className = 'flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100 rounded';
                label.innerHTML = `
                    <input type="checkbox" class="tag-checkbox" data-tag-id="${tag.id}" data-tag-name="${tag.name}" value="${tag.id}">
                    <span class="text-gray-700">${tag.name}</span>
                `;
                this.tagList.appendChild(label);

                label.querySelector('.tag-checkbox').addEventListener('change', (e) => {
                    if (e.target.checked) {
                        this.selectedTagIds.add(parseInt(tag.id));
                    } else {
                        this.selectedTagIds.delete(parseInt(tag.id));
                    }
                    this.updateSelectedTagsDisplay();
                });
            });
        } catch (error) {
            console.error('Error loading tags:', error);
        }
    }

    addNewTag() {
        const tagName = this.newTagInput.value.trim();
        if (!tagName) return;

        this.newTags.add(tagName);
        this.newTagInput.value = '';
        this.updateSelectedTagsDisplay();
    }

    updateSelectedTagsDisplay() {
        this.selectedTagsDisplay.innerHTML = '';

        // Display selected existing tags
        this.selectedTagIds.forEach(tagId => {
            const checkbox = document.querySelector(`[data-tag-id="${tagId}"]`);
            if (checkbox) {
                const tagName = checkbox.dataset.tagName;
                const badge = document.createElement('span');
                badge.className = 'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800';
                badge.innerHTML = `
                    ${tagName}
                    <button type="button" class="remove-tag" data-tag-id="${tagId}" onclick="event.stopPropagation()">×</button>
                `;
                this.selectedTagsDisplay.appendChild(badge);

                badge.querySelector('.remove-tag').addEventListener('click', () => {
                    checkbox.checked = false;
                    this.selectedTagIds.delete(tagId);
                    this.updateSelectedTagsDisplay();
                });
            }
        });

        // Display new tags
        this.newTags.forEach(tagName => {
            const badge = document.createElement('span');
            badge.className = 'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800';
            badge.innerHTML = `
                ${tagName} (新)
                <button type="button" class="remove-new-tag" data-tag-name="${tagName}" onclick="event.stopPropagation()">×</button>
            `;
            this.selectedTagsDisplay.appendChild(badge);

            badge.querySelector('.remove-new-tag').addEventListener('click', () => {
                this.newTags.delete(tagName);
                this.updateSelectedTagsDisplay();
            });
        });
    }

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.startTime = Date.now() - (this.elapsedTime * 1000);
        this.startBtn.disabled = true;
        this.stopBtn.disabled = false;

        this.intervalId = setInterval(() => this.updateTimer(), 100);
    }

    updateTimer() {
        const now = Date.now();
        this.elapsedTime = Math.floor((now - this.startTime) / 1000);
        this.timerDisplay.textContent = this.formatTime(this.elapsedTime);
    }

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    stop() {
        if (!this.isRunning) return;

        this.isRunning = false;
        clearInterval(this.intervalId);
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;

        this.displayDuration.textContent = this.formatTime(this.elapsedTime);
        this.saveForm.classList.remove('hidden');

        // Clear previous selections
        this.selectedTagIds.clear();
        this.newTags.clear();
        this.descriptionInput.value = '';
        document.querySelectorAll('.tag-checkbox').forEach(cb => cb.checked = false);
        this.updateSelectedTagsDisplay();
    }

    reset() {
        this.isRunning = false;
        clearInterval(this.intervalId);
        this.elapsedTime = 0;
        this.timerDisplay.textContent = '00:00:00';
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.saveForm.classList.add('hidden');
    }

    async save() {
        if (this.elapsedTime === 0) {
            alert('計測時間が0秒です');
            return;
        }

        const startTime = new Date(this.startTime);
        const endTime = new Date(this.startTime + this.elapsedTime * 1000);

        const recordData = {
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            duration: this.elapsedTime,
            description: this.descriptionInput.value.trim() || null,
            tag_ids: Array.from(this.selectedTagIds),
            tag_names: Array.from(this.newTags),
        };

        try {
            const response = await fetch('/api/records', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(recordData),
            });

            if (!response.ok) {
                throw new Error('Failed to save record');
            }

            alert('記録を保存しました！');
            this.reset();
            this.loadTags();
            this.loadRecentRecords();
        } catch (error) {
            console.error('Error saving record:', error);
            alert('記録の保存に失敗しました');
        }
    }

    cancelSave() {
        this.reset();
    }

    async loadRecentRecords() {
        try {
            const response = await fetch('/api/records?limit=5');
            const records = await response.json();

            this.recentRecords.innerHTML = '';

            if (records.length === 0) {
                this.recentRecords.innerHTML = '<p class="text-gray-500">記録がありません</p>';
                return;
            }

            records.forEach(record => {
                const recordEl = document.createElement('div');
                recordEl.className = 'p-3 bg-gray-50 rounded border border-gray-200';

                const startTime = new Date(record.start_time);
                const duration = this.formatTime(record.duration);
                const tags = record.tags.map(t => t.name).join(', ');

                recordEl.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="font-semibold text-gray-800">${startTime.toLocaleString('ja-JP')}</p>
                            <p class="text-sm text-gray-600">時間: ${duration}</p>
                            ${tags ? `<p class="text-sm text-gray-600">タグ: ${tags}</p>` : ''}
                            ${record.description ? `<p class="text-sm text-gray-600">詳細: ${record.description}</p>` : ''}
                        </div>
                    </div>
                `;
                this.recentRecords.appendChild(recordEl);
            });
        } catch (error) {
            console.error('Error loading recent records:', error);
        }
    }
}

// Initialize timer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Timer();
});
