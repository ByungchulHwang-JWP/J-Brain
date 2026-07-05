/* eslint-disable react/prop-types */

const WorkflowActionBar = ({ note, children }) => (
  <section className="workflow-action-bar">
    <div className="workflow-action-note">{note}</div>
    <div className="workflow-action-buttons">{children}</div>
  </section>
);

export default WorkflowActionBar;
