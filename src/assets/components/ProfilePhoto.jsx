import { useNavigate } from 'react-router-dom';


const ProfilePhoto = ({ profile, user }) => {

  const name =
    profile?.username ||
    user?.displayName ||
    user?.email ||
    '👋';

  const firstLetter = name.charAt(0).toUpperCase();

  const photo = profile?.photo || user?.photoURL;
  const navigate = useNavigate();
  const handleClick = () => {
    navigate('/profile');
  };

  return (
    <>
      {user && (
        <button
          type="button"
          className="flex cursor-pointer items-center gap-2"
          onClick={handleClick}
          aria-label="View profile"
        >
          {photo ? (
            <img
              src={photo}
              alt="profile"
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 font-bold text-white">
              {firstLetter}
            </div>
          )}
        </button>
      )}
    </>
    
  );
};
export default ProfilePhoto
