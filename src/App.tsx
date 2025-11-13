import { SearchForm } from './components/SearchForm';
import './styles/main.scss'; 

function App() {
  const isLoading = false; 

  const handleSearch = (countryId: string) => {
    console.log(`[APP] Start search for tours in Country ID: ${countryId}`);
    // Завдання 2
  }
  
  return (
    <div className="app-container">
      <SearchForm onSubmit={handleSearch} isSearching={isLoading}/>
    </div>
  );
}

export default App;