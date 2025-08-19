class Question {
    constructor(id, text, options, correctIndex) {
        this.id = id;
        this.text = text;
        this.options = options;
        this.correctIndex = correctIndex;
    }

    isCorrect(answerIndex) {
        return answerIndex === this.correctIndex;
    }
}

class QuizEngine {
    constructor(quizData) {
        this.title = quizData.title;
        this.timeLimitSec = quizData.timeLimitSec;
        this.passThreshold = quizData.passThreshold;
        this.questions = quizData.questions.map(q => new Question(q.id, q.text, q.options, q.correctIndex));
        this.currentQuestionIndex = 0;
        this.answers = new Array(this.questions.length).fill(null);
        this.timeLeft = this.timeLimitSec;
        this.timerId = null;
        this.loadProgress();
        this.initDOM();
        this.render();
        this.startTimer();
    }

    initDOM() {
        this.quizTitle = document.getElementById('quiz-title');
        this.timerDisplay = document.getElementById('time-left');
        this.timerBar = document.getElementById('timer-bar');
        this.progressText = document.getElementById('progress-text');
        this.progressBar = document.getElementById('progress-bar');
        this.questionText = document.getElementById('question-text');
        this.optionsContainer = document.getElementById('options');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.finishBtn = document.getElementById('finish-btn');
        this.quizContainer = document.getElementById('quiz');
        this.resultContainer = document.getElementById('result');
        this.scoreDisplay = document.getElementById('score');
        this.percentageDisplay = document.getElementById('percentage');
        this.statusDisplay = document.getElementById('status');
        this.reviewBtn = document.getElementById('review-btn');
        this.restartBtn = document.getElementById('restart-btn');
        this.reviewContainer = document.getElementById('review');

        this.prevBtn.addEventListener('click', () => this.prevQuestion());
        this.nextBtn.addEventListener('click', () => this.nextQuestion());
        this.finishBtn.addEventListener('click', () => this.finishQuiz());
        this.reviewBtn.addEventListener('click', () => this.showReview());
        this.restartBtn.addEventListener('click', () => this.restartQuiz());
        document.addEventListener('keydown', this.handleKeydown.bind(this));
    }

    loadProgress() {
        const saved = localStorage.getItem('quizProgress');
        if (saved) {
            const progress = JSON.parse(saved);
            this.currentQuestionIndex = progress.currentQuestionIndex;
            this.answers = progress.answers;
            this.timeLeft = progress.timeLeft;
        }
    }

    saveProgress() {
        localStorage.setItem('quizProgress', JSON.stringify({
            currentQuestionIndex: this.currentQuestionIndex,
            answers: this.answers,
            timeLeft: this.timeLeft
        }));
    }

    startTimer() {
        this.timerId = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            if (this.timeLeft <= 0) {
                this.finishQuiz();
            }
            this.saveProgress();
        }, 1000);
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        this.timerBar.style.width = `${(this.timeLeft / this.timeLimitSec) * 100}%`;
    }

    render() {
        this.quizTitle.textContent = this.title;
        this.progressText.textContent = `Вопрос ${this.currentQuestionIndex + 1} из ${this.questions.length}`;
        this.progressBar.style.width = `${((this.currentQuestionIndex + 1) / this.questions.length) * 100}%`;
        this.questionText.textContent = this.questions[this.currentQuestionIndex].text;
        this.optionsContainer.innerHTML = '';
        const options = this.questions[this.currentQuestionIndex].options;
        if (!options || options.length === 0) {
            console.error('No options available for question:', this.questions[this.currentQuestionIndex]);
            return;
        }
        options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = `option ${this.answers[this.currentQuestionIndex] === index ? 'selected' : ''}`;
            optionDiv.innerHTML = `
                <input type="radio" name="option" id="opt${index}" value="${index}"
                    ${this.answers[this.currentQuestionIndex] === index ? 'checked' : ''}>
                <label for="opt${index}">${option}</label>
            `;
            optionDiv.addEventListener('click', () => this.selectOption(index));
            this.optionsContainer.appendChild(optionDiv);
        });
        this.prevBtn.disabled = this.currentQuestionIndex === 0;
        this.nextBtn.style.display = this.currentQuestionIndex === this.questions.length - 1 ? 'none' : 'inline-flex';
        this.finishBtn.style.display = this.currentQuestionIndex === this.questions.length - 1 ? 'inline-flex' : 'none';
    }

    selectOption(index) {
        this.answers[this.currentQuestionIndex] = index;
        this.saveProgress();
        this.render();
    }

    prevQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.render();
        }
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            this.render();
        }
    }

    finishQuiz() {
        clearInterval(this.timerId);
        this.quizContainer.style.display = 'none';
        this.resultContainer.style.display = 'block';
        const score = this.answers.reduce((sum, answer, i) => 
            sum + (answer !== null && this.questions[i].isCorrect(answer) ? 1 : 0), 0);
        const percentage = (score / this.questions.length) * 100;
        this.scoreDisplay.textContent = `Правильных ответов: ${score} из ${this.questions.length}`;
        this.percentageDisplay.textContent = `Процент: ${percentage.toFixed(1)}%`;
        this.statusDisplay.textContent = percentage >= this.passThreshold * 100 ? 'Пройден' : 'Не пройден';
        this.reviewBtn.style.display = 'inline-block';
        this.restartBtn.style.display = 'inline-block';
        localStorage.removeItem('quizProgress');
    }

    showReview() {
        this.reviewBtn.style.display = 'none';
        this.restartBtn.style.display = 'inline-block';
        this.reviewContainer.style.display = 'block';
        this.reviewContainer.innerHTML = '';
        this.questions.forEach((question, i) => {
            const reviewDiv = document.createElement('div');
            reviewDiv.innerHTML = `
                <p>${question.text}</p>
                <ul>
                    ${question.options.map((option, j) => `
                        <li class="option ${j === question.correctIndex ? 'correct' : ''} 
                            ${this.answers[i] === j && j !== question.correctIndex ? 'incorrect' : ''}">
                            ${option}
                        </li>
                    `).join('')}
                </ul>
            `;
            this.reviewContainer.appendChild(reviewDiv);
        });
    }

    restartQuiz() {
        this.currentQuestionIndex = 0;
        this.answers = new Array(this.questions.length).fill(null);
        this.timeLeft = this.timeLimitSec;
        this.resultContainer.style.display = 'none';
        this.reviewContainer.style.display = 'none';
        this.quizContainer.style.display = 'block';
        this.render();
        clearInterval(this.timerId);
        this.startTimer();
    }

    handleKeydown(event) {
        if (event.key === 'ArrowLeft' && !this.prevBtn.disabled) {
            this.prevQuestion();
        } else if (event.key === 'ArrowRight' && this.currentQuestionIndex < this.questions.length - 1) {
            this.nextQuestion();
        } else if (event.key === 'Enter' && this.currentQuestionIndex === this.questions.length - 1) {
            this.finishQuiz();
        }
    }
}

fetch('data/questions.json')
    .then(response => response.json())
    .then(data => new QuizEngine(data))
    .catch(error => console.error('Error loading quiz data:', error));
