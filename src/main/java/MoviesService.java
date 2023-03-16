import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MoviesService {
    @Autowired
    private MoviesRepository movieRepository;
    public List<Movies> allMovies() {
        return movieRepository.findAll();
    }
}
