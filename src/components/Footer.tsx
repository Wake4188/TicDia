import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-black border-t border-gray-800 py-8 mt-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-400 text-sm">
            © {new Date().getFullYear()} TicDia. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm">
            <a 
              href="/privacy" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-wikitok-red transition-colors"
            >
              Privacy Policy
            </a>
            <a 
              href="/terms" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-wikitok-red transition-colors"
            >
              Terms of Service
            </a>
            <a 
              href="mailto:jessica.wilhide@gmail.com"
              className="text-gray-400 hover:text-wikitok-red transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
        <div className="text-center mt-4 text-xs text-gray-500">
          <p>
            Content from Wikipedia is licensed under{" "}
            <a 
              href="https://creativecommons.org/licenses/by-sa/3.0/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-wikitok-red transition-colors"
            >
              CC BY-SA 3.0
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};
