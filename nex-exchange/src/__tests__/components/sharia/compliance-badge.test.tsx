import { render, screen } from "@testing-library/react";
import { ComplianceBadge } from "@/components/sharia/compliance-badge";

describe("ComplianceBadge", () => {
  it("should render compliance badge", () => {
    render(<ComplianceBadge />);
    expect(screen.getByText("Sharia Compliant")).toBeInTheDocument();
    expect(screen.getByText("(AAOIFI Certified)")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(<ComplianceBadge className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});

