import React, { useEffect, useState } from "react";

const MCQPage = () => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8000/questions")
      .then((res) => res.json())
      .then(setQuestions)
      .catch(console.error);
  }, []);

  const currentQuestion = questions[currentIndex];
  const selected = answers[currentIndex] || [];

  const handleSingleChoice = (selectedOption) => {
    setAnswers({ ...answers, [currentIndex]: [selectedOption] });
  };

  const handleMultiChoice = (selectedOption) => {
    const current = answers[currentIndex] || [];
    const exists = current.includes(selectedOption);
    const question = questions[currentIndex];

    let updated;
    if (exists) {
      updated = current.filter((s) => s !== selectedOption);
    } else if (!exists && (!question.maxSelections || current.length < question.maxSelections)) {
      updated = [...current, selectedOption];
    } else {
      updated = current;
    }

    setAnswers({ ...answers, [currentIndex]: updated });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSubmit = async () => {
    const payload = {};
    questions.forEach((q, idx) => {
      payload[q.id] = answers[idx] || [];
    });

    try {
      const res = await fetch("http://localhost:8000/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload }),
      });

      if (res.ok) {
        setSubmitted(true);
        alert("✅ Submitted successfully!");
      } else {
        throw new Error("Submission failed");
      }
    } catch (error) {
      console.error("Error saving response:", error);
      alert("❌ Failed to submit. Try again.");
    }
  };

  const getProgressPercent = () =>
    ((currentIndex + 1) / questions.length) * 100;

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center text-2xl">
        ✅ Thank you for completing the quiz!
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">🧠 Quiz</h1>

        {/* Progress bar */}
        <div className="w-full bg-gray-300 rounded-full h-3 mb-6">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${getProgressPercent()}%` }}
          ></div>
        </div>

        {currentQuestion && (
          <div className="bg-white shadow rounded p-4 mb-6">
            <h2 className="text-xl font-semibold mb-3">{currentQuestion.text}</h2>
            {currentQuestion.canSkip && (
              <p className="text-sm text-gray-500 mb-2">Skippable</p>
            )}
            <div className="space-y-2">
              {currentQuestion.options.map((opt, oIdx) => {
                const isSelected = selected.includes(opt.label);
                const isMulti = currentQuestion.type === "multi_choice";

                return (
                  <button
                    key={oIdx}
                    className={`w-full flex items-center gap-3 border rounded px-4 py-2 text-left ${
                      isSelected
                        ? "bg-blue-100 border-blue-500"
                        : "bg-white hover:bg-gray-100"
                    }`}
                    onClick={() =>
                      isMulti
                        ? handleMultiChoice(opt.label)
                        : handleSingleChoice(opt.label)
                    }
                  >
                    {opt.icon && (
                      <i className={`${opt.icon} text-lg w-6 text-gray-700`}></i>
                    )}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {currentQuestion.type === "multi_choice" && currentQuestion.maxSelections && (
              <p className="text-sm text-gray-500 mt-2">
                Max selections allowed: {currentQuestion.maxSelections}
              </p>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <button
            onClick={() => setCurrentIndex(Math.max(currentIndex - 1, 0))}
            disabled={currentIndex === 0}
            className="bg-gray-300 px-4 py-2 rounded shadow disabled:opacity-50"
          >
            ⬅️ Back
          </button>

          {currentIndex === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              className="bg-green-600 text-white px-6 py-2 rounded-lg shadow hover:bg-green-700 transition"
            >
              ✅ Submit
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition"
            >
              Next ➡️
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MCQPage;
