import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { api } from "../lib/api.js";
import { Navbar } from "../components/Navbar.jsx";
import { Button } from "../components/Button.jsx";
import { Textarea } from "../components/Input.jsx";
import { useParams } from "react-router-dom";

export default function LeaveReview() {
  const { appointmentId } = useParams();
  const [searchParams] = useSearchParams();
  const counsellorId = searchParams.get("counsellorId");
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (rating === 0) { setError("Please select a rating."); return; }
    setError("");
    setSubmitting(true);
    try {
      await api.leaveReview({ counsellorId, appointmentId, rating, comment });
      toast.success("Thank you for your feedback.");
      navigate("/appointments");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-content mx-auto px-5 pt-10 pb-24">
        <div className="max-w-sm mx-auto">
          <p className="step-label mb-2">Share your experience</p>
          <h1 className="font-serif text-[36px] text-ink mb-2">Leave a review</h1>
          <p className="text-[14px] text-muted mb-8">
            Your feedback helps other clients choose the right counsellor.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-[13px] font-medium text-ink mb-3 block">How would you rate this session?</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHovered(n)}
                    onMouseLeave={() => setHovered(0)}
                    className="p-1"
                    aria-label={`${n} star${n !== 1 ? "s" : ""}`}
                  >
                    <Star
                      size={28}
                      strokeWidth={1.5}
                      className={`transition-colors ${
                        n <= (hovered || rating) ? "fill-pine text-pine" : "text-line"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="font-mono text-[12px] text-muted mt-1">
                  {["", "Poor", "Fair", "Good", "Very good", "Excellent"][rating]}
                </p>
              )}
            </div>

            <Textarea
              label="Comment (optional)"
              placeholder="What was most helpful? What could be improved?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            {error && (
              <p className="text-[13px] text-clay bg-clay-tint border border-clay/20 px-3 py-2 rounded-[10px]">
                {error}
              </p>
            )}

            <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
              {submitting ? "Submitting ..." : "Submit review"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
