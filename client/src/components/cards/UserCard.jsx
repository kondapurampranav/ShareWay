// client/src/components/cards/UserCard.jsx
// TODO: implement this component

export default function UserCard({ children, ...props }) {
  return (
    <div {...props}>
      {children}
    </div>
  );
}
